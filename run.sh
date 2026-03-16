
#!/bin/sh
export DISPLAY=:0  # Attach to root X server
export ELECTRON_DISABLE_SANDBOX=true  # Bypass Electron sandbox
npm run start
