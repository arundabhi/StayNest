import { useState } from 'react'




function App() {
  const [count, setCount] = useState(0)

  return (
    <div className='w-full h-full p-10 text-center'>
     <button className='text-white bg-black py-4 px-10 rounded-2xl border border-red-500 font-semibold text-4xl' onClick={()=>setCount(count+1)}>Click</button>
     <p className='text-4xl text-center'>{count}</p>
     <button className='text-white bg-black py-4 px-10 rounded-2xl border border-red-500 font-semibold text-4xl' onClick={()=>setCount(count-1)}>Click</button>
    </div>
  )
}

export default App
