@echo off
echo Starting CanopyIQ MCP Server locally...
echo.

set CANOPYIQ_API_KEY=test-api-key-123
set CANOPYIQ_ENDPOINT=http://localhost:3000/api/claude

echo Environment configured:
echo - API Key: %CANOPYIQ_API_KEY%
echo - Endpoint: %CANOPYIQ_ENDPOINT%
echo.

echo Starting server (press Ctrl+C to stop)...
echo.

node dist/index.js