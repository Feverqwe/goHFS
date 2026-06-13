#!/usr/bin/env bash

# Simple appify replacement script
# Creates a macOS .app bundle from a binary

# Default values
MENUBAR=false
NAME=""
AUTHOR=""
APP_ID=""
ICON_PATH=""
BINARY=""
VERSION="1.0"
ALLOWINSECURECONNECTIONS=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -menubar)
            MENUBAR=true
            shift
            ;;
        -name)
            NAME="$2"
            shift 2
            ;;
        -author)
            AUTHOR="$2"
            shift 2
            ;;
        -id)
            APP_ID="$2"
            shift 2
            ;;
        -icon)
            ICON_PATH="$2"
            shift 2
            ;;
        -version)
            VERSION="$2"
            shift 2
            ;;
        -allowinsecureconnections)
            ALLOWINSECURECONNECTIONS=true
            shift
            ;;
        -*)
            echo "Unknown option $1"
            exit 1
            ;;
        *)
            BINARY="$1"
            shift
            ;;
    esac
done

# Check required parameters
if [[ -z "$NAME" ]] || [[ -z "$BINARY" ]] || [[ -z "$APP_ID" ]]; then
    echo "Usage: $0 [-menubar] [-allowinsecureconnections] -name <name> -author <author> -id <id> [-icon <icon_path>] [-version <version>] <binary>"
    exit 1
fi

# Check if binary exists
if [[ ! -f "$BINARY" ]]; then
    echo "Error: Binary '$BINARY' not found"
    exit 1
fi

# Create app structure
APP_PATH="./${NAME}.app"
CONTENTS_PATH="${APP_PATH}/Contents"
MACOS_PATH="${CONTENTS_PATH}/MacOS"
RESOURCES_PATH="${CONTENTS_PATH}/Resources"

echo "Creating app bundle: ${APP_PATH}"

# Remove existing app bundle
if [[ -d "$APP_PATH" ]]; then
    rm -rf "$APP_PATH"
fi

# Create directory structure
mkdir -p "$MACOS_PATH"
mkdir -p "$RESOURCES_PATH"

# Copy binary
cp "$BINARY" "$MACOS_PATH/"

# Copy icon if provided
if [[ -n "$ICON_PATH" ]] && [[ -f "$ICON_PATH" ]]; then
    cp "$ICON_PATH" "$RESOURCES_PATH/"
fi

# Create Info.plist
cat > "${CONTENTS_PATH}/Info.plist" << EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>${NAME}</string>
    <key>CFBundleIdentifier</key>
    <string>${APP_ID}</string>
    <key>CFBundleName</key>
    <string>${NAME}</string>
    <key>CFBundleVersion</key>
    <string>${VERSION}</string>
    <key>CFBundleShortVersionString</key>
    <string>${VERSION}</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleSignature</key>
    <string>????</string>
EOF

if [[ -n "$AUTHOR" ]]; then
    cat >> "${CONTENTS_PATH}/Info.plist" << EOF
    <key>CFBundleGetInfoString</key>
    <string>${NAME} by ${AUTHOR}</string>
EOF
fi

if [[ -n "$ICON_PATH" ]] && [[ -f "$ICON_PATH" ]]; then
    ICON_NAME=$(basename "$ICON_PATH")
    cat >> "${CONTENTS_PATH}/Info.plist" << EOF
    <key>CFBundleIconFile</key>
    <string>${ICON_NAME}</string>
EOF
fi

if [[ "$MENUBAR" == true ]]; then
    cat >> "${CONTENTS_PATH}/Info.plist" << EOF
    <key>LSUIElement</key>
    <true/>
EOF
fi

# Add NSAppTransportSecurity for network applications (allow insecure connections)
if [[ "$ALLOWINSECURECONNECTIONS" == true ]]; then
    cat >> "${CONTENTS_PATH}/Info.plist" << EOF
    <key>NSAppTransportSecurity</key>
    <dict>
        <key>NSAllowsArbitraryLoads</key>
        <true/>
    </dict>
EOF
fi

cat >> "${CONTENTS_PATH}/Info.plist" << EOF
</dict>
</plist>
EOF

# Make binary executable
chmod +x "${MACOS_PATH}/${BINARY}"

echo "App bundle created successfully: ${APP_PATH}"