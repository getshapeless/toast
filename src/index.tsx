import * as React from 'react'
import {forwardRef, useEffect, useRef, useState, createContext} from 'react'
import {v4 as uuid} from 'uuid'
import {animated, useTransition, config} from 'react-spring'
import Portal from '@reach/portal'

const ToastContext = createContext(null)

function Timeout(this: any, callback: Function, delay: number) {
  let timerId: number
  let start: number
  let remaining = delay

  this.pause = () => {
    window.clearTimeout(timerId)
    remaining -= Date.now() - start
  }

  this.resume = () => {
    start = Date.now()
    window.clearTimeout(timerId)
    timerId = window.setTimeout(callback, remaining)
  }

  this.resume()
}

type ToastProps = {
  id: number,
  message: string,
  clearToast: ()=>void,
  timer: any,
  style: Object
}

function _Toast({id, message, clearToast, timer, style}: ToastProps, ref: string | ((instance: HTMLDivElement | null) => void) | React.RefObject<HTMLDivElement> | null | undefined) {
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    if (isPaused) {
      timer.pause()
    } else {
      timer.resume()
    }
  }, [isPaused, timer])

  return (
    <animated.div style={style} onMouseOver={() => setIsPaused(true)} onMouseOut={() => setIsPaused(false)}>
      <div ref={ref} className="shapeless-toast">
        <div className="w-full flex p-2">
          <span className="mr-auto">{message}</span>
          <button onClick={() => clearToast(id)}>
            <div className="sr-only">Close Toast</div>
            <svg className="w-5 hover:opacity-75" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
        <div className={`shapeless-toast-bar ${isPaused ? 'shapeless-toast-bar-paused' : 'shapeless-toast-bar-animation'}`} />
      </div>
    </animated.div>
  )
}

const Toast = forwardRef(_Toast)

const TOAST_DURATION = 8000

type ToastContainerProps = {
  children: React.ReactNode
}

export function ToastContainer({children}:ToastContainerProps) {
  const refMap = useRef<{[key: string]: any}>({})
  const [toasts, setToasts] = useState([])

  const enter = (item: any) => async (next: (arg0: { transform?: string; opacity?: number; height: any }) => any) => {
    await next({
      transform: 'translate3d(0,0,0)',
      opacity: 1,
      height: 80,
    })
    await next({height: refMap.current[item.id].clientHeight + 4})
  }

  const leave = () => async (next: (arg0: { transform: string; opacity: number; height: number }) => any) => {
    await next({transform: 'translate3d(0,-40px,0)', opacity: 0, height: 0})
  }

  const transitions = useTransition(toasts, (toast) => toast.id, {
    from: {transform: 'translate3d(0,-40px,0)', opacity: 0, height: 0, overflow: 'hidden'},
    enter: enter as any,
    leave: leave as any,
    config: {
      tension: 390,
      mass: 1,
      friction: 26,
    },
  })

  function addToast(message: string) {
    const id = uuid()
    // const timer = new Timeout(() => null, TOAST_DURATION)
    const timer = new Timeout(() => clearToast(id), TOAST_DURATION)
    setToasts([...toasts, {message, id, timer}])
  }

  function clearToast(id: string) {
    setToasts((currentToasts) => {
      const index = currentToasts.findIndex((toast) => toast.id === id)
      return currentToasts.filter((_, i) => i !== index)
    })
  }

  const showToast = () => addToast(uuid())

  return (
    <ToastContext.Provider value={showToast}>
      <style>
        {`
        @keyframes shrink{
          from{
            width: 100%;
          }
          to{
            width: 0%;
          }
        }

        .shapeless-toast-bar{
          position: absolute;
          bottom: 0;
          left: 0;
          height: 4px;
          background: #000;
          animation: shrink linear ${TOAST_DURATION / 1000}s;
          animation-play-state: running;
        }
  
        .shapeless-toast-bar-paused{
          animation-play-state: paused;
        }
        .shapeless-toast{
          display: flex;
          align-items: center;
          background: #fff;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          border-radius: 5px;
          margin: 5px 0;
          min-height: 80px;
          position: relative;
          padding-bottom: 5px;
        }
        .shapeless-toast-container{
          display: flex;
          flex-direction: column-reverse;
          max-width: 400px;
          position: fixed;
          top: 6px;
          right: 6px;
        }
        `}
      </style>
        {children}
        <Portal>
          <div className="shapeless-toast-container">
            {transitions.map(({item, props, key}) => (
              <Toast
                ref={(ref) => {
                  if (ref) {
                    refMap.current[item.id] = ref
                  }
                }}
                key={key}
                {...item}
                clearToast={clearToast}
                style={props}
              />
            ))}
          </div>
        </Portal>
      </ToastContext.Provider>
  )
}


export default function useToast(){
  return React.useContext(ToastContext)
}