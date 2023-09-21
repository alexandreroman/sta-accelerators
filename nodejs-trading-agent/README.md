# NodeJS Trading Agent implementation

This repository contains a NodeJS
[Trading Agent](https://github.com/alexandreroman/sta-trading-agent)
implementation for [Spring Trading App](https://github.com/alexandreroman/sta).

You may use this repository as a project template.

Be creative, write the best algorithm and make some money 🤑

## Prerequisites

Make sure you get the OAuth2 credentials required for accessing the
[Stock Marketplace](https://github.com/alexandreroman/sta-marketplace) API,
as well as the marketplace URL and the user you picked for placing bids.

Those configuration parameters are actually defined as
[Service Binding](https://servicebinding.io/) attributes:

| Name   | Key                 | Value                         |
|--------|---------------------|-------------------------------|
| config | app.agent.user      | User defined for placing bids |
| config | app.marketplace.url | Spring Trading App URL        |
| sso    | client-id           | OAuth2 Client Id              |
| sso    | client-secret       | OAuth2 Client Secret          |
| sso    | issuer-uri          | OAuth2 Issuer URI             |

### Setting the configuration for your local workstation

Edit the configuration in [`local/bindings`](local/bindings/).

Each key in a binding configuration is actually a file:
the file content brings the value.

### Setting the configuration for TAP Sandbox

Edit the configuration in [`config/app-operator`](config/app-operator/).

You have 2 files in this directory, which are actually Kubernetes Secret resources.

## How to run the app?

Run this command to build and run the app:

```shell
npm install && npm start
```

The app is available at http://localhost:8084.

## Deploy this app to TAP Sandbox

Run this command to deploy your app to TAP Sandbox:

```shell
kubectl apply -f config -f config/app-operator
```
