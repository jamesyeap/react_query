# Notes on React Query

## Using DevTools for React Query
```javascript
import { ReactQueryDevtools } from 'react-query/devtools'
```

## Refetching Behavior
By default, Queries are automatically re-fetched every time the user clicks on the window. 

This is called `refetchOnWindowFocus`.

To disable it,
```javascript
const queryInfo = useQuery('queryKey', queryFn, {
	refetchOnWindowFocus: false;
});
```

To indicate to the user that data is being re-fetched, use the following att:
```javascript
queryInfo.isFetching
	? // show updating status here
	: // show the actual data
```

Note: `queryInfo.isLoading` is only relevant when data is first being fetched -> it will remain `false` when data is being re-fetched.

## Configuring Query Stale-Time
By default, Queries are marked as `stale` as soon as they are resolved. Queries that are `stale` will be re-fetched as the window is re-focused (if previously enabled).

To change this,
```javascript
// to change stale-time to 5 seconds,
const queryInfo = useQuery('queryKey', queryFn, {
	staleTime: 5000; // in milliseconds
});

// to prevent a query from ever re-fetching,
const queryInfo = useQuery('queryKey', queryFn, {
	staleTime: Infinity;
});
```

## Configuring Query Cache-Time
By default, Queries are cached for around 5 minutes. This means that data that is not used by the user and thus becomes marked as `inactive` (such as when the user hides the component where the data is used), it will get deleted by garbage-collection.

To change this,
```javascript
const queryInfo = useQuery('queryKey', queryFn, {
	// to change cache-time to 5 seconds,
	cacheTime: 5000; // in milliseconds
});
```

## Query Keys
When multiple components call `useQuery` using the same `queryKey`, only 1 actual-request will be made, which saves data.

For example,
```javscript
const queryKey = 'pokemon';

const queryInfo_A = useQuery(queryKey, queryFn);
const queryInfo_B = useQuery(queryKey, queryFn);
const queryInfo_C = useQuery(queryKey, queryFn);
```
Since the `queryKey` is the same for all three requests, React Query will only run `queryFn` once!

## Wrapping useQuery inside Custom-Hooks
Refactoring: for components that have `useQuery` with the same `queryKey`, instead of typing out useQuery(...) in each of them, which is quite lengthy, we can just wrap `useQuery` in a hook, and call the hook in these components.

Example:
```javascript
function usePokemon() {
	return queryInfo = useQuery('queryKey', queryFn, {
		// to change cache-time to 5 seconds,
		cacheTime: 5000; // in milliseconds
	});
}

function consumerA() {
	const data = usePokemon().data;

	// do something with the data 
}

function consumerB() {
	const data = usePokemon().data;

	// do something with the data 
}
```

## Disabling Queries
In cases such as when a search box is empty, you don't want to send queries searching for an empty string (wastes data).

To set conditions that must be fulfilled for a query to be sent out,
```javascript
const queryInfo = useQuery('queryKey', queryFn, {
	enabled: searchTerm // hence, if searchTerm = "", which will evaluate to false, the query won't be sent out.
});
```

## Multipart Query Keys
In addition to taking in a string, `queryKey` can also take in an array.
```javascript
const queryKey_A = "data";
const queryKey_B = ["label", "data"]; // more descriptive!

const queryInfo = useQuery(queryKey_B, queryFn);
```
This makes it clearer what is being fetched when looking at React Dev-Tools.


## Automatic Query Retries
By default, if a Query fails (such as when an error 404 is returned), React Query will retry it a couple of times; each time waiting a little bit longer before another attempt is made (increasing the amount of delay between retries).

To change this,
```javascript
const queryInfo = useQuery('queryKey', queryFn, {
	retry: 2, // maximum of 2 retries will be attempted
	retryDelay: 1000 // 1 second between retries
});
```

To increase the amount of delay between retries,
```
const queryInfo = useQuery('queryKey', queryFn, {
	retry: 2,
	retryDelay: attemptIndex => 1000 * (2 ** attemptIndex); // amount of delay will double between retries
});
```

## Query Cancellation
For invalid Queries (such as when an error 404 is returned), you won't want to cache the data returned.

// TODO: place code-snippet here

## Dependent Queries
If a Query needs data from another Query in order to proceed (example: fetching Posts from a User needs the user's details such as user_id to be fetched first before Posts from the user can be fetched), use the following:

```javascript
const userQuery = useQuery('user', () => 
    axios
      .get(`https://jsonplaceholder.typicode.com/users?email=${email}`)
      .then(res => res.data[0])
)

// postsQuery needs data fetched from userQuery before it can proceed
const postsQuery = useQuery('posts', () => 
axios
	.get(`https://jsonplaceholder.typicode.com/posts?userId=${userQuery.data.id}`)
	.then(res => res.data), {
	enabled: (userQuery.data?.id !== undefined), // use this to check
	}
)
```

Also, note that when a Query is still waiting on another Query to be successfully completed, it's state will be `isIdle`, not `isLoading`.

## Supplying a Query with Initial Data
To supply a Query with initial data, do the following:

```javascript
const existingData = {
	id: 1,
	name: "Jack"
}

const queryInfo = useQuery('queryKey', queryFn, {
	initialData: existingData
});
```

Doing so causes the Query to not fetch any data initially, but it can still update when the Query is stale.

## Marking Initial Data as Stale
By default, a Query filled with `initialData` is not marked as `stale` and will be treated as any other successfully completed Query.

To change this,
```javascript
const queryInfo = useQuery('queryKey', queryFn, {
	initialData: existingData,
	initialStale: true // Query with initialData will now be marked as stale immediately
});
```
This is useful when placeholder data is used for `initialData`, and you want to fetch actual data and replace the placeholder data with it as soon as the component mounts.

## Seeding Initial Query Data from Other Queries (Pull Approach)
In cases where a Query's data has been fetched by another Query (such as data for a specific Post being already fetched by a Query fetching data for all Posts), you can actually pull the data already obtained as the `initialData` and use it in the `initialState` for the aforementioned Query.

To do so,
```javascript
import { useQueryClient } from 'react-query' // you will need an additional component from React Query

// fetches data for all Posts
function Posts() {
	const postsQuery = useQuery('posts', () =>
		axios
			.get("https://jsonplaceholder.typicode.com/posts")
			.then(res => res.data)
	)

	// ...other stuff
}

// displays specific data for one Post
function Post(postId) {
	// to access the queryClient
	const queryClient:any = useQueryClient();

	const postQuery = useQuery(['post', postId], () => 
		axios
			.get(`https://jsonplaceholder.typicode.com/posts/${postId}`)
			.then(res => res.data)
		, 
		{
			// search pre-fetched data to see if this post has already been fetched
			initialData: () => queryClient.getQueryData('posts')?.find((post:any) => post.id === postId)
		}
	)

	// ...other stuff
}
```

## Using Query Data to Seed Future Queries (Push Approach)
In the above-approach, in each child Query, you're pulling data from the parent Query and setting the `initialState` for the child Query.

An alternative approach would be pre-generating child Queries once the parent Query has been successfully completed, like so:
```javascript
// fetches data for all Posts
function Posts() {
	const queryClient:any = useQueryClient();

	// inside the QueryFn,
	const postsQuery = useQuery('posts', async () => {
		const posts = await axios
			.get("https://jsonplaceholder.typicode.com/posts")
			.then(res => res.data)

		// pre-generate Queries with the QueryKey and individual data
		posts.forEach((post:any) => 
      		queryClient.setQueryData(['post', post.id], post)
    	);

		return posts;
	})

	// ...other stuff
}
```

## Query Side-Effects
When a Query is completed, it will be in 2 states: `Success` and `Error`. (note: `Settled` is also a state, meaning that a Query is completed, successful or not).

To call a function once a Query has been completed, do the following:
```javascript
const postsQuery = useQuery('posts', fetchPosts, {
	onSuccess: (data) => { console.log(data); },
	onError: (error) => { console.log(error); },
	onSettled: (data, error) => { data ? console.log(data) : console.log(error); }
})
```

## Scroll Restoration
As long as data used in a Query is still inside the cache, the user's last-scrolled position in the page will be restored. However, if the data is removed from the cache (through garbage-collection), the user's last-scrolled position will not be restored, as the data will have to be fetched again, creating an entirely new component(?). <- actually not too sure if a new component will be created because of this

To ensure that the user's last-scrolled position is kept around, just ensure that the `cacheTime` of the Query is long enough.

```javascript
const postQuery = useQuery('posts', fetchPosts, {
	cacheTime: 10000, // data will be kept inside the cache for 10 seconds, and so will the user's last-scrolled position.
})
```

## Query Polling with Refetch Intervals
To refetch a Query at set time-intervals (such as refetching every 5 seconds), do the following:
```javascript
const queryInfo = useQuery('queryKey', queryFn, {
	refetchInterval: 5000, // re-fetches once every 5 seconds
	refetchIntervalInBackground: true // default: false -> if false, refetching is only done when the user has focused on the window
});
```

## Query Invalidation Basics
To manually refetch a Query (possible use-case: a refresh button), do the following:
```javascript
function Posts() {
	const queryClient:any = useQueryClient();

	const postsQuery = useQuery('posts', fetchPosts);

	// when clicked, the button below will refetch the Query with the QueryKey 'posts'
	return (
		<div>
			<button onClick={() => queryClient.invalidateQueries('posts')}>Refetch</button>
		</div>
	)
}
```

## Invalidating and Refetching Inactive Queries
By default, Queries that are not active (ie the Query's data is not shown on screen), they will not be re-fetched immediately when they are invalidated. Instead, they will only be marked as `stale`, and re-fetched only when they become active again.

If you want the Query to be re-fetched in the background, do the following:
```javascript
function Posts() {
	const queryClient:any = useQueryClient();

	const postsQuery = useQuery('posts', fetchPosts);

	// pass in a config object to the invalidateQueries call
	return (
		<div>
			<button onClick={() => queryClient.invalidateQueries('posts', {
				refetchInactive: true; // default: false
			})}>Refetch</button>
		</div>
	)
}
```

## Invalidating Multiple Queries with Similar Query Keys
Invalidating a `QueryKey` invalidates all Queries with the `QueryKey` alone and with the `QueryKey` as the prefix. 

For example,
```javascript
function Random() {
	const queryClient:any = useQueryClient();

	const randomQuery_A = useQuery(['random', 'A'], fetchRandomNumber);
	const randomQuery_B = useQuery(['random', 'B'], fetchRandomNumber);
	const randomQuery_C = useQuery(['random', 'C'], fetchRandomNumber);

	// clicking on the button will refetch randomQuery_A, randomQuery_B and randomQuery_C
	return (
		<div>
			<button onClick={() => queryClient.invalidateQueries('random')}>Refetch</button>
		</div>
	)
}
```

## Basic Query Pre-Fetching
To complete a Query before the relevant component mounts (such as loading things in the background), do the following:
```javascript
import { useState, useEffect } from 'react' // you'll need useEffect for this

const fetchPosts = async () => {
	// call axios here
}

function App() {
	const queryClient:any = useQueryClient();

	const [showPosts, setShowPosts] = useState<boolean>(false);

	// prefetches the data needed for 'posts'
	useEffect(() => {
		queryClient.prefetchQuery('posts', fetchPosts)
	}, []); // add an empty dependency array in useEffect so that the prefetching is only done once

	return (
		<div>
			<button onClick={() => setShowPosts(!showPosts)}> See/Hide </button>
			{showPosts && <Posts />}
		</div>
	)
}

function Posts() {
	// this query would already be completed inside App even if Posts is hidden!
	const postsQuery = useQuery('posts', fetchPosts);

	// ...more stuff here
}

```

## Hover-Based Query Pre-Fetching
To complete a Query when a user hovers over a component (such as a link), pass the call to `prefetchQuery` to the attribute `onMouseEnter` of the aforementioned component.

A short example
```javascript
function App() {
	const queryClient:any = useQueryClient();

	const post:any = {
		id: 1;
	}

	return (
		<li 
			key={post.id}
			// pass a function to call prefetchQuery here
			onMouseEnter={() => {
				queryClient.prefetchQuery(['posts', post.id], fetchPosts(post.id)) // will fetch the details for post with id=1 here
			}}
		>
		Will prefetch when mouse hovers over this list item.
		</li>
	)
}
```

## Pre-Fetching and Stale-Time
To avoid pre-fetching a Query every time the user hovers over the component, pass in a config object to the call to `prefetchQuery`, like so:
```javascript
function App() {
	const queryClient:any = useQueryClient();

	const post:any = {
		id: 1;
	}

	return (
		<li 
			key={post.id}
			onMouseEnter={() => {
				queryClient.prefetchQuery(['posts', post.id], fetchPosts(post.id), {
					staleTime: Infinity, // only pre-fetches once
				})
			}}
		>
		Will prefetch when mouse hovers over this list item.
		</li>
	)
}
```

## Forced Pre-Fetching
By default, pre-fetching will not be done for Queries that are not yet `stale`. To pre-fetch Queries regardless if they are `stale` or not, pass in a SECOND config object to the call to `prefetchQuery`, like so:
```javascript
function App() {
	const queryClient:any = useQueryClient();

	const post:any = {
		id: 1;
	}

	return (
		<li 
			key={post.id}
			onMouseEnter={() => {
				queryClient.prefetchQuery(
					['posts', post.id], 
					fetchPosts(post.id),
					null, // attribute "force" is not in the first config object,
					{     // and is found in the second config object
						force: true
					}
				)
			}}
		>
		Will prefetch when mouse hovers over this list item.
		</li>
	)
}
```

## Mutations with the useMutation Hook
For any CREATE, UPDATE or DELETE requests sent to the database, the data stored will change (assuming requests are successful of course). 

This means that the data fetched previously from our Queries may become invalid.
To keep data in the frontend application in-sync with the database, use the `useMutation` hook from React Query:

```javascript

// other stuff here...

const postFunction = async (values) => {
	axios.post('/api/posts', values)
}

// useMutation returns 2 things:
//		the postFunction itself (in this case, postFunction can now be accessed with createPost)
//		the status of the postFunction itself, (in this case, createPostInfo)
const [createPost, createPostInfo] = useMutation(
	postFunction,
	{
		onSuccess: () => {
			queryClient.invalidateQueries('posts') // after creating a new post, tell React Query to fetch the new list of Posts.
		}
	}
)

// createPostInfo has the following attributes:
//		isLoading
//		isError
//		isSuccess
// which is useful for changing components in the UI to let the user know the state of the request.
```
## Mutations Side-Effects
In addition to fetching the updated set of data on successful mutations, it is also possible to pass in functions to be called on other outcomes (such as unsuccessful mutations).

Example
```javascript
const [createPost, createPostInfo] = useMutation(
	postFunction,
	{
		onSuccess: () => {
			queryClient.invalidateQueries('posts')
		},
		onError: (error) => { // displays the error to the user in a pop-up window
			window.alert(error.response.data.message)
		},
		onSettled: () => {	// runs when the mutation request has been completed
			console.log("request done")
		}
	}
)
```

## Updating Query Data with Mutation Responses
Instead of refetching the whole list of data after updating a specific item (such as refetching all Posts after updating a single Post), we can just refetch the Query for the updated item, like so:
```javascript
const [createPost, createPostInfo] = useMutation(
	postFunction,
	{
		onSuccess: (data, values) => {
			// only refetch the updated Post!
			queryClient.invalidateQueries(['post', String(value.id)])
		}
	}
)
```

An alternative to the above is, instead of refetching the Query for the updated item, if the updated data for the item is returned by the response of the server, we can just replace its Query with the updated data.
```javascript
const [createPost, createPostInfo] = useMutation(
	postFunction,
	{
		onSuccess: (data, values) => {
			// replaces the Query with the updated data so that the user sees the change as soon as possible
			queryClient.setQueryData(['post', String(values.id)], data);
			// to be 100% sure that the data is in-sync with the server, it's good to just do another re-fetch for the Query
			queryClient.invalidateQueries(['post', String(value.id)])
		}
	}
)
```

## Optimistic Updates for List-Like Queries
In between sending a mutation-request to the server, getting a response (whether or not it was successful), and refetching the updated data from the server, there may be some delay. Where appropriate, we can assume that the mutation-request was successful (hence optimistic), and display what the user would see when the request eventually completes.

To do so, we pass in an additional attribute to the config object in the `useMutation` hook:
```javascript
const [createPost, createPostInfo] = useMutation(
	postFunction,
	{
		onMutate: (values) => {
			queryClient.setQueryData('posts', (oldPosts) => {
				// append a new object to the current list of posts	
				return [
					...oldPosts,
					// the new object will have mocked value(s) since it's not actually from the server
					{
						...values,
						id: Date.now() // mocked value (because we don't know the id of the new Post yet)
					}
				]
			})
		},
		onSuccess: () => {
			queryClient.invalidateQueries('posts') // and if all goes well, the data returned by the re-fetch will look exactly the same as the mocked one, and the user won't see anything
		}
	}
)
```
This makes the user-experience more "snappy".

## Rollbacks for Optimistic Updates for List-Like Queries
In optimistic updates, there is a risk that the mutation fails. To rollback the optimistic update in this scenario, do the following:
```javascript
const [createPost, createPostInfo] = useMutation(
	postFunction,
	{
		onMutate: (values) => {
			// save a snapshot of the data prior to the optimistic-update
			const oldPosts = useClient.getQueryData('posts')

			queryClient.setQueryData('posts', (oldPosts) => {
				return [
					...oldPosts,
					{
						...values,
						id: Date.now()
					}
				]
			})

			// and return it
			return oldPosts;

			// alternative
			// return () => queryClient.setQueryData('posts', oldData)
		},
		// oldData is an object returned by the function passed to "onMutate" and can be anything; even a function
		onError: (error, values, oldData) => {
			queryClient.setQueryData('posts', oldData)

			// alternative 
			// oldData(); // oldData will be a function here
		}
	}
)
```