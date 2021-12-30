# Notes on React Query

## Using DevTools for React Query
```
import { ReactQueryDevtools } from 'react-query/devtools'
```

## Refetching Behavior
By default, Queries are automatically re-fetched every time the user clicks on the window. 

This is called `refetchOnWindowFocus`.

To disable it,
```
const queryInfo = useQuery('queryKey', queryFn, {
	refetchOnWindowFocus: false;
});
```

To indicate to the user that data is being re-fetched, use the following att:
```
queryInfo.isFetching
	? // show updating status here
	: // show the actual data
```

Note: `queryInfo.isLoading` is only relevant when data is first being fetched -> it will remain `false` when data is being re-fetched.

## Configuring Query Stale-Time
By default, Queries are marked as `stale` as soon as they are resolved. Queries that are `stale` will be re-fetched as the window is re-focused (if previously enabled).

To change this,
```
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
```
const queryInfo = useQuery('queryKey', queryFn, {
	// to change cache-time to 5 seconds,
	cacheTime: 5000; // in milliseconds
});
```

## Query Keys
When multiple components call `useQuery` using the same `queryKey`, only 1 actual-request will be made, which saves data.

For example,
```
const queryKey = 'pokemon';

const queryInfo_A = useQuery(queryKey, queryFn);
const queryInfo_B = useQuery(queryKey, queryFn);
const queryInfo_C = useQuery(queryKey, queryFn);
```
Since the `queryKey` is the same for all three requests, React Query will only run `queryFn` once!

## Wrapping useQuery inside Custom-Hooks
Refactoring: for components that have `useQuery` with the same `queryKey`, instead of typing out useQuery(...) in each of them, which is quite lengthy, we can just wrap `useQuery` in a hook, and call the hook in these components.

Example:
```
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
```
const queryInfo = useQuery('queryKey', queryFn, {
	enabled: searchTerm // hence, if searchTerm = "", which will evaluate to false, the query won't be sent out.
});
```

## Multipart Query Keys
In addition to taking in a string, `queryKey` can also take in an array.
```
const queryKey_A = "data";
const queryKey_B = ["label", "data"]; // more descriptive!

const queryInfo = useQuery(queryKey_B, queryFn);
```
This makes it clearer what is being fetched when looking at React Dev-Tools.


## Automatic Query Retries
By default, if a Query fails (such as when an error 404 is returned), React Query will retry it a couple of times; each time waiting a little bit longer before another attempt is made (increasing the amount of delay between retries).

To change this,
```
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

```
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

```
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
```
const queryInfo = useQuery('queryKey', queryFn, {
	initialData: existingData,
	initialStale: true // Query with initialData will now be marked as stale immediately
});
```
This is useful when placeholder data is used for `initialData`, and you want to fetch actual data and replace the placeholder data with it as soon as the component mounts.

## Seeding Initial Query Data from Other Queries
In cases where a Query's data has been fetched by another Query (such as data for a specific Post being already fetched by a Query fetching data for all Posts), you can actually use the data already obtained as the `initialData` for the aforementioned Query.

To do so,
```
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