# Starting the Development Server

If you're getting "connection failed" on localhost, follow these steps:

## Step 1: Open Terminal
Open your terminal application (Terminal.app on Mac)

## Step 2: Navigate to Project
```bash
cd /Users/christopherhunt/AIagency
```

## Step 3: Start the Server
```bash
npm run dev
```

## Step 4: Wait for Compilation
You should see output like:
```
▲ Next.js 14.2.5
- Local:        http://localhost:3000
- Ready in 2.3s
```

## Step 5: Open Browser
Open http://localhost:3000 in your browser

## Troubleshooting

If the server doesn't start:
1. Make sure you're in the correct directory
2. Check that node_modules exists: `ls node_modules`
3. If node_modules is missing, run: `npm install`
4. Check if port 3000 is already in use: `lsof -ti:3000`
5. If port is in use, kill the process or use a different port: `npm run dev -- -p 3001`

## Common Issues

- **"npm: command not found"** - Node.js/npm is not installed or not in PATH
- **"Port 3000 already in use"** - Another process is using the port
- **"Cannot find module"** - Run `npm install` to install dependencies
- **Blank screen** - Check browser console (F12) for JavaScript errors
