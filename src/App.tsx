import { useQuery, useQueryClient, QueryClient } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools'
import { useState } from 'react';
import axios from "axios";

function App() {
  const [show, setShow] = useState<boolean>(true);
  const [pokemon, setPokemon] = useState<string>("");
  const [postId, setPostId] = useState<number>(-1);

  return (
    <div>
      {/* <input value={pokemon} onChange={(e) => setPokemon(e.target.value)} />
      <PokemonSearch pokemon={pokemon} /> */}

      {/* <button onClick={() => setShow(!show)}>{show ? "Hide" : "Show"}</button>    
      {show && <Pokemon />} */}

      {/* <MyPosts /> */}

      {
        (postId > -1)
          ? <Post postId={postId} setPostId={setPostId} />
          : <Posts setPostId={setPostId} />
      }
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

function PokemonSearch({pokemon, id}:{pokemon:string, id:number}) {  
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

function MyPosts() {
  const existingData = {
    id: 1,
    name: "Leanne Graham"
  }

  const userQueryConfig = {
    initialData: existingData,
    staleTime: 5000
  }

  const email = 'Sincere@april.biz';

  const userQuery = useQuery('user', () => 
    axios
      .get(`https://jsonplaceholder.typicode.com/users?email=${email}`)
      .then(res => res.data[0])
    , userQueryConfig
  )

  // postsQuery needs data fetched from userQuery before it can proceed
  const postsQuery = useQuery('posts', () => 
    axios
      .get(`https://jsonplaceholder.typicode.com/posts?userId=${userQuery.data.id}`)
      .then(res => res.data), {
        enabled: (userQuery.data?.id !== undefined), // use this to check
      }
  )

  if (userQuery.isLoading) { return (<div>Fetching user details...</div>) }

  return (
    <div>
      User Id: {userQuery.data.id}

      <br />
      <br />
      {postsQuery.isIdle ? null 
        : postsQuery.isLoading
            ? (<span>Loading Posts</span>)
            : (<div>Post Count: {postsQuery.data.length}</div>)
      }
    </div>
  )
}

interface Post {
  id: number,
  title: string
}

function Posts({setPostId}: {setPostId: (postId: number) => void}) {
  const postsQuery = useQuery('posts', () =>
    axios
      .get("https://jsonplaceholder.typicode.com/posts")
      .then(res => res.data)
  )

  console.log(postsQuery.data)

    return (
      <div>
        <h1>Posts</h1>
        <div>
          {postsQuery.isLoading
            ? ("Loading Posts...")
            : (
              <div>
                {postsQuery.data.map((post:Post) => {
                  return (
                    <div key={post.id}>
                      <a onClick={() => setPostId(post.id)} href="#">
                        {post.title}
                      </a>
                    </div>
                  )
                })}
              </div>
            )
          }
        </div>
      </div>
    )
}

function Post({postId, setPostId}: {postId:number, setPostId: (postsId:number) => void}) {
  const queryClient:any = useQueryClient();

  const postQueryParams = {
    initialStale: false,
    staleTime: Infinity, // never refetch
    initialData: () => queryClient.getQueryData('posts')?.find((post:any) => post.id === postId)
  }

  const postQuery = useQuery(['post', postId], async () => {
    await new Promise(resolve => setTimeout(resolve, 1000)); // simulate loading

    return axios
      .get(`https://jsonplaceholder.typicode.com/posts/${postId}`)
      .then(res => res.data)
    }, postQueryParams
  )

  return (
    <div>
      <button onClick={() => setPostId(-1)}>Go Back</button>

      <br />
      <br />

      {postQuery.isLoading
        ? (<div>Loading post...</div>)
        : (<div>{postQuery.data?.title}</div>)
      }
    </div>
  )
}

export default App;
