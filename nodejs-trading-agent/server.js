const express = require('express')
const app = express()
const path = require('path')
const fs = require('fs')
const openIdClient = require('openid-client')
const axios = require('axios')

// Load service bindings from a well known location.
function loadBindings(name) {
  const bindingRoot = process.env.SERVICE_BINDING_ROOT || path.join(process.cwd(), 'local', 'bindings')
  const bindingsDir = path.join(bindingRoot, name)
  const bindings = {}
  if(fs.existsSync(bindingsDir)) {
    const files = fs.readdirSync(bindingsDir, {})
    files.forEach(file => {
      const filePath = fs.realpathSync(path.join(bindingsDir, file))
      if(!fs.lstatSync(filePath).isDirectory()) {
        const value = fs.readFileSync(filePath)
        bindings[file] = value.toString()
      }
    })
  }
  return bindings
}

function randomNumber(min, max) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min)) + min
}

function randomBoolean() {
  return Math.random() < 0.5
}

// Get OAuth2 access token.
async function getOAuth2Token() {
  const ssoBindings = loadBindings('sso')
  const issuerUri = ssoBindings['issuer-uri']
  console.log(`Fetching OAuth2 token from ${issuerUri}`)

  const issuer = await openIdClient.Issuer.discover(issuerUri)
  const oauth2Client = new issuer.Client({
    client_id: ssoBindings['client-id'],
    client_secret: ssoBindings['client-secret']
  })
  const token = await oauth2Client.grant({
      grant_type: ssoBindings['authorization-grant-types'],
      scope: ssoBindings['scope']
    })
  return token.access_token
}

function axiosError(error) {
  console.error("Got network error", error)
}

async function getStocks() {
  return axios.get('/api/v1/stocks').catch(axiosError).then(resp => resp.data)
}

async function placeBid(user, symbol, shares) {
  const body = {
    user: user,
    symbol: symbol,
    shares: shares
  }
  console.log(`Placing bid: ${shares} x ${symbol}`)
  return axios.post('/api/v1/bids', body, {
    headers: {
      'content-type': 'application/json',
    }
  }).catch(axiosError)
}

async function tick(req, res) {
  const user = config['app.agent.user']
  console.log(`Executing bid agent for user ${user}`)

  const stocks = await getStocks()
  const symbols = stocks.map(s => s.symbol)

  const stockSymbol = symbols[randomNumber(0, symbols.length)]
  const stockPrice = stocks.find(s => s.symbol == stockSymbol).price

  const shares = 100 * (randomBoolean() ? 1 : -1)
  placeBid(user, stockSymbol, shares)

  const out = `
NodeJS Trading Agent implementation
Current user: ${user}
Stock: ${stockSymbol}
Price: ${stockPrice}
Placing bid: ${shares} x ${stockSymbol}
`
  res.type('txt')
  res.send(out)
}

// Load app config.
const config = loadBindings('config')
const baseUrl = config['app.marketplace.url']
console.log(`Using marketplace URL: ${baseUrl}`)
axios.defaults.timeout = 30000
axios.defaults.headers.common = {
  'User-Agent': 'sta-trading-agent-nodejs'
}
var oauth2Token
axios.interceptors.request.use(async function(config) {
  // Set the OAuth2 token as a HTTP header.
  if(oauth2Token == null) {
    oauth2Token = await getOAuth2Token()
    console.log("OAuth2 token: " + oauth2Token)
  }
  config.headers.Authorization = `Bearer ${oauth2Token}`

  // Prepend the base URL if not set.
  if(!config.url.startsWith('http://') && !config.url.startsWith('https://')) {
    config.url = baseUrl + config.url
  }
  return config
})

// Set up main endpoint.
app.get('/', (req, res) => {
  try {
    tick(req, res)
  } catch(error) {
    console.error('Trading Agent failed to execute:', error)
  }
})

// Set up health check endpoint.
app.get('/health', (req, res) => {
  res.type('txt')
  res.send('UP\n')
})

// Start the HTTP server.
const port = parseInt(process.env.PORT || '8084')
const server = app.listen(port, () => {
  console.log(`Listening on port ${port}`)
})

process.on('SIGTERM', () => {
  server.close()
})
