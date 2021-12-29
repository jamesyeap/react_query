import { useQuery } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools'
import { useState } from 'react';
import axios from "axios";

function App() {
  const [show, setShow] = useState<boolean>(true);
  const [pokemon, setPokemon] = useState<string>("");  

  return (
    <div>
      <input value={pokemon} onChange={(e) => setPokemon(e.target.value)} />
      <PokemonSearch pokemon={pokemon} />

      {/* <button onClick={() => setShow(!show)}>{show ? "Hide" : "Show"}</button>    
      {show && <Pokemon />} */}
      <ReactQueryDevtools />
    </div>
  )
}

const fetchAllPokemon = async () => {
  // simulate loading time cuz internet connection too fast
  //    to actually see the loading screen
  await new Promise(resolve => setTimeout(resolve, 1000));

  // uncomment to simulate error being thrown during request
  //   if (true) { throw new Error('Test error'); }

  return axios.get("https://pokeapi.co/api/v2/pokemon")
              .then(res => res.data.results);
}

// a hook encapsulating a useQuery request
function usePokemon() {
  let queryConfig:any = {
    refetchOnWindowFocus: true, // default: true
    staleTime: 5000, // default: 0
    cacheTime: 5000 // default: 300000 -> 5 minutes
  }

  const queryInfo:any = useQuery('pokemon', fetchAllPokemon, queryConfig);

  return queryInfo;
}

function Count() {
  const queryInfo:any = usePokemon();

  return (
    <div>
      You are looking at <b>{queryInfo.data?.length}</b> pokemon.
    </div>
  )
}

function Pokemon() {
  const queryInfo:any = usePokemon();

  if (queryInfo.isLoading) { return (<div>Loading...</div>) }
  if (queryInfo.isError) { return (<div>{queryInfo.error.message}</div>) }
  
  // isFetching is true when data is being re-fetched
  if (queryInfo.isFetching) { return (<div>Updating...</div>) }

  return (
        <div>
          <Count />

          <div>  
            {queryInfo.data?.map((elem:any) => (
              <div key={elem.name}>{elem.name}</div>
            ))}
          </div>
        </div>
  )
}

function PokemonSearch({pokemon}:{pokemon:string} ) {  
  const queryInfo:any = useQuery(pokemon, async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));

    return axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemon}`)
                .then(res => res.data);
  });

  if (queryInfo.isLoading) { return (<div>Loading...</div>) }
  if (queryInfo.isError) { return (<div>{queryInfo.error.message}</div>) }
  if (queryInfo.isFetching) { return (<div>Updating...</div>) }

  return (
    <div>
      {queryInfo.data?.sprites?.front_default 
        ? (<img src={queryInfo.data.sprites.front_default} alt="pokemon" />)
        : 'Pokemon not found.'
      }
    </div>
  )

}

export default App;
