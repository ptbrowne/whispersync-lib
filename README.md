Whispersync retriever
=====================

This repository contains a library to retrieve annotations and list of books
from your Kindle library.

Disclaimer: It uses the Whispersync API to do so and using it is likely a violation
of your TOS conditions. The code is available here only for education purposes.

A [blog post][] explains in more details the process behind this.

The repository contains:

* [whispersync-client][]: A node js library that can register a device on your
  Kindle account and use this device to retrieve the content.

* [content-server][]: Uses the whispersync client to display a server to
  explore your content. The content is retrieve from your Amazon and cached on
  disk.

### Installation


```
git clone git://github.com/ptbrowne/whispersync-lib
cd whispersync-lib
npm install
```

### Usage

`whispersync-client` can be used through the CLI.

```
npm run cli fetch books > books.json
npm run cli fetch sidecar <ASIN> # fetch annotations
```

It can also be used directly through an HTTP server.

```
npm run server
```

[whispersync-client]: ./whispersync-client
[content-server]: ./content-server
[blog post]: https://ptbrowne.github.io/posts/whispersync-reverse-engineering/
