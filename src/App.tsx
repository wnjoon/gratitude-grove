import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import SignUp from '@/pages/SignUp'
import MyDiary from '@/pages/MyDiary'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/my-diary" element={<MyDiary />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
