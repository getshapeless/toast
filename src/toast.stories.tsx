import * as React from 'react'
import useToast, {ToastContainer} from './index'

export default {
    title: 'Toast'
}

function Example(){
    const toast = useToast()

    return <button onClick={toast}>Click me</button>
}

export const Default = ()=> <ToastContainer>
<Example />
</ToastContainer> 