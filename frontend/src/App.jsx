import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    <div className="flex  justify-center">
    <h1 className="text-red-500 text-2xl text-center">Hello</h1>
    </div>
   </>
  )
}

export default App
