import Pokemon from "./Pokemon";
import { ReactQueryDevtools } from 'react-query/devtools'

function App() {
  return (
    <div>
      <Pokemon />
      <ReactQueryDevtools />
    </div>
  )
}

export default App;
