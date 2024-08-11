# Deno Dart Compiler Server

A simple Deno server that interfaces with the DartPad API to compile Dart code and manages code storage with expiration functionality using Deno KV.

## Endpoints

### `POST /dart`
Compiles Dart code using the DartPad API.

**Request Body:**
```json
{
  "code": "Your Dart code as a string"
}
```

**Response:**
```json
{
  "result": "Compiled JavaScript code"
}
```

### `POST /save`
Saves Dart code with a unique identifier and timestamp.

**Request Body:**
```json
{
  "uid": "Unique identifier for the user",
  "code": "Your Dart code as a string"
}
```

**Response:**
```json
{
  "message": "Code saved successfully"
}
```

### `GET /load`
Loads saved Dart code by UID and displays it on a webpage.

**Query Parameters:**
- `uid`: Unique identifier for the user.


## Scheduling

The server includes a cron job that performs a daily cleanup of expired code entries. This job is scheduled to run at 12:00 IST (06:30 UTC) every day.

## Permissions

The server requires the following permissions:
- `--allow-net`: Network access for HTTP requests.
- `--allow-read`: Read access for file operations.
- `--allow-write`: Write access for file operations.
- `--allow-env`: Environment variable access.