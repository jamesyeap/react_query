import axios from "axios";
import React from "react";
import { useQuery } from 'react-query';

const fetchAllPokemon = () => {
  return axios.get("https://pokeapi.co/api/v2/pokemon")
              .then(res => console.log(res));
}

function App() {
  const queryInfo = useQuery('pokemon', fetchAllPokemon);

  return (<div>Hello.</div>);
}

export default App;
