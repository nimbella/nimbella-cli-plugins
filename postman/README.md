# Nimbella Postman Plugin

This package is a plugin to extend the functionality of the Nimbella command interface, plugins allow developers to extend the functionality by adding commands or features.

## Prerequisites

This is an extension to the [Nimbella Command Line Tool](https://github.com/nimbella/nimbella-cli), ensure you have [it](https://nimbella.io/downloads/nim/nim.html#install-nim-globally)

```
nim -v
nimbella-cli/1.5.0 linux-x64 node-v14.4.0

```

## Install

Use this command to install the latest version of Postman plugin

```
nim plugins add postman
```

or to install a specific version

```
nim plugins add postman-1.0.0
```

## Verify

Check the list of currently installed plugins:

```
nim plugins
postman-1.0.0
```

---

> Now you are one command away from generating a full blown Serverless Nimbella Project and two commands away from taking your APIs out in the world.

Making the most out of your Postman Collection, this command traverses through each endpoint, generates mocks, unit tests and postman tests, Of course merging well with what you have in the collection already!

run below command and check your output directory for the resulting Nimbella Project.

```
nim project create -s postman -i CloudKV.ioAPI  -k <postman-key> -l php -c
```

Here `nim project create` project does exactly what it promises to be doing.

The `-i` stands for identity, it could be Collection Id, Name or even a file on your disk, provided it's a valid postman collection. You can even use your old collections which you haven't touched for ages. This command converts your version 1.0 collection into version 2.0 and also saves it to your disk.

The `-k` expects a postman key, but it's optional, if you are providing a collection file via `-i`.

> If you want the collection to be pulled from the Postman cloud and do not have an API Key, you can easily generate one by heading over to the [Postman Integrations Dashboard](https://go.postman.co/integrations/services/pm_pro_api)

The `-l` is for language and it also is optional. It defaults to `nodejs`, but can be given any language from below the supported languages table.

Optionally, specifying `-c` flag will generate client code in language of your choice to call and test the newly created APIs. You can also choose other than default variants for your client code from below table. It can be passed in via `-l` value following a `:` e.g. `-i php:pecl_http`

### Supported Languages

| Language | Available Variants             | Default Variant |
| -------- | ------------------------------ | --------------- |
| Go       | Native                         | Native          |
| Java     | OkHttp, Unirest                | OkHttp          |
| NodeJs   | Native, Request, Unirest       | Request         |
| PHP      | cURL, HTTP_Request2, pecl_http | cURL            |
| Python   | http.client, Requests          | http.client     |
| Swift    | URLSession                     | URLSession      |

There are few more gears in the box, but you probably don't need all of them initially.
Below table covers full usage options:

## Usage Options

Options:

| Name               | Alias  | Description                                                 | Type    | Required | Choices                                | Default |
| ------------------ | ------ | ----------------------------------------------------------- | ------- | -------- | -------------------------------------- | ------- |
| **--help**         |        | Show help                                                   | boolean |          |                                        |
| **--version**      |        | Show version number                                         | boolean |          |                                        |
| **--source**       | **-s** | Source Name                                                 | string  | required | Postman, SwaggerHub, Stoplight, Apiary | Postman |
| **--id**           | **-i** | Document/Collection Id/Name/Path                            | string  | required |                                        |
| **--key**          | **-k** | Key to access the Providers API                             | string  |          |                                        |         |
| **--language**     | **-l** | Target Language                                             | string  |          | go, nodejs, python, java, swift, php   | nodejs  |
| **--overwrite**    | **-o** | Deletes the existing nimbella project directory if it exits | boolean |          |                                        | false   |
| **--updateSource** | **-u** | Sync updated document back to the Source App                | boolean |          |                                        | false   |
| **--clientCode**   | **-c** | Generates Client Code to test the deployed actions          | boolean |          |                                        | true    |
| **--update**   |  | Updates an existing project from new version of postman collection          | boolean |          |                                        | false    |

> Despite all the options available, you only need a Collection (`-i`) or maybe a key (`-k`).

Lo and behold, you have your serverless project created! You can open up your favorite IDE and browse through created code base. The size of the project obviously depends on the size of your collection.

Time to deploy? back to the command prompt again.
cd into the project folder and do a

```
nim project deploy .
```

Congratulations! your APIs are live now.

verify the list of actions

```
nim action list
```

That's it! Easy isn't it?

You are into the groove now!

Extend -> Test -> Deploy -> Test -> Extend

```mermaid
graph LR
    Extend --> Test --> Deploy --> Test --> Extend
```

> While you do your iteration with ease and needless to say, peace of mind comes bundled with serverless. This plugin also keeps your collection and project in sync. Be it the collection in Postman Cloud, Postman App or Collection in your file system. Things are in perfect harmony with your work in project or vice versa.

## Remove

```
nim plugins uninstall postman
```

## Update

Plugins will autoupdate alongside the CLI, but to trigger an update directly run:

```
nim update
```

---

## Source Structure

```mermaid
graph TD;
    invoker-->fetcher;
    invoker-->reader;
    invoker-->writer;
    reader-->generators;
    generators-->writer;
    invoker-->syncer;
    invoker-->generators;
```

- fetcher - they get data from apis
- syncer - they post updated data back to the apis
- reader - they read data fetched by fetcher or from file system, parse them and try to make sense out of that
- writer - they write documents using text generated by the generators, to the documents on file system
- generators - they generate sensible text/code from data given by readers
- invoker - they talk to the generators, fetcher, syncer, reader and writer, essentially they are controllers controlling all other participants
