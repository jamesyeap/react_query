import axios from "axios";
import React from "react";
import { useQuery } from 'react-query';
import { resourceLimits } from "worker_threads";

const fetchAllPokemon = async () => {
  // simulate loading time cuz internet connection too fast
  //    to actually see the loading screen
  await new Promise(resolve => setTimeout(resolve, 1000));

  // simulate error being thrown during request
  if (true) { throw new Error('Test error'); }

  return axios.get("https://pokeapi.co/api/v2/pokemon")
              .then(res => res.data.results);
}

function App() {
  const queryInfo:any = useQuery('pokemon', fetchAllPokemon);

  if (queryInfo.isLoading) { return (<div>Loading...</div>) }
  if (queryInfo.isError) { return (<div>{queryInfo.error.message}</div>) }

  return (
    <div>
      {queryInfo.data?.map((elem:any) => (
        <div key={elem.name}>{elem.name}</div>
      ))}
    </div>
  )
}

export default App;
