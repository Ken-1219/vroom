# Vroom MCP Server

Connect any MCP-compatible AI assistant (Claude Desktop, Cursor, Windsurf, etc.) to Vroom and book cars through natural language.

## Available tools

| Tool | Description |
|------|-------------|
| `search_vehicles` | Search by city, type, dates, price |
| `get_vehicle` | Full vehicle details, specs, pricing |
| `get_price_estimate` | Exact price breakdown before booking |
| `create_booking` | Book a vehicle |
| `get_my_bookings` | List your bookings |
| `get_booking` | Details of a specific booking |
| `cancel_booking` | Cancel a booking |
| `get_cities` | All available cities |

## Setup

### Step 1 — Get your API token

Call the auth endpoint once to generate a 30-day token:

```bash
curl -X POST https://vroom-cars.vercel.app/api/mcp/auth \
  -H "Content-Type: application/json" \
  -d '{"email":"renter@demo.vroom.app","password":"demo123"}'
```

Response:
```json
{
  "token": "eyJ...",
  "expiresIn": "30d",
  "user": { "id": "...", "name": "Arjun Mehta", "role": "renter" }
}
```

Copy the `token` value — you'll use it as `VROOM_API_KEY`.

### Step 2 — Configure your AI client

#### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "vroom": {
      "command": "node",
      "args": ["/path/to/vroom/packages/mcp-server/dist/index.js"],
      "env": {
        "VROOM_BASE_URL": "https://vroom-cars.vercel.app",
        "VROOM_API_KEY": "your-token-here"
      }
    }
  }
}
```

#### Cursor

Add to `.cursor/mcp.json` in your project (or `~/.cursor/mcp.json` globally):

```json
{
  "mcpServers": {
    "vroom": {
      "command": "node",
      "args": ["/path/to/vroom/packages/mcp-server/dist/index.js"],
      "env": {
        "VROOM_BASE_URL": "https://vroom-cars.vercel.app",
        "VROOM_API_KEY": "your-token-here"
      }
    }
  }
}
```

#### Any other MCP client

The server uses stdio transport — run it with:

```
VROOM_BASE_URL=https://vroom-cars.vercel.app VROOM_API_KEY=<token> node dist/index.js
```

### Step 3 — Build (if running locally)

```bash
cd packages/mcp-server
pnpm build
```

## Demo accounts

| Email | Password | Role |
|-------|----------|------|
| `renter@demo.vroom.app` | `demo123` | Renter |
| `host@demo.vroom.app` | `demo123` | Host |
| `admin@demo.vroom.app` | `demo123` | Admin |

## Example prompts

> "Find me an SUV in Bangalore for next weekend"

> "What's the total price to rent the Toyota Fortuner from June 10 to June 13 with premium insurance?"

> "Book the cheapest available car in Mumbai for 3 days starting tomorrow"

> "Show me all my upcoming bookings"

> "Cancel my booking — plans changed"

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VROOM_BASE_URL` | Yes | Your Vroom deployment URL |
| `VROOM_API_KEY` | For booking tools | JWT token from `/api/mcp/auth` |
