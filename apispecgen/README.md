# Nimbella API Specifications Generator

This package is a plugin to extend the functionality of the Nimbella command interface, plugins allow developers to extend the functionality by adding commands or features.

## Prerequisites

This is an extension to the [Nimbella Command Line Tool](https://nimbella.io/downloads/nim/nim.html), ensure you have [it](https://nimbella.io/downloads/nim/nim.html#install-nim-globally).

The command in this plugin can be invoked using `nim project update --config`. It will generate api specifications in the specified format for an existing nimbella project.

```
nim -v
nimbella-cli/1.6.0 linux-x64 node-v14.4.0

```

## Install

Use this command to install the latest version of apispecgen plugin

```
nim plugin add apispecgen
```

## Verify

Check the list of currently installed plugins:

```
nim plugins
apispecgen-1.0.0
```

## Usage

```
nim project update --config
```

---

## Uninstall

Use this command to uninstall this plugin

```
nim plugin remove apispecgen
```
