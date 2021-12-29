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