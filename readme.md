## level-replicate-tests

currently tests level-replicate with msgpack transport over a binary websocket

```
npm install
npm test
```


there is also a bulk binary benchmark that stores thousands of typed arrays in indexeddb locally and then measures how long it takes for them all to replicate over a binary websocket to node

```
npm run bench
```