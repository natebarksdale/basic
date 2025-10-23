# Diplomatic Plate Decoder

A fun and interactive web app for looking up US diplomatic license plates and discovering which countries they represent.

## Features

- **Interactive Plate Decoder**: Enter a diplomatic license plate code and instantly discover the country and diplomat type
- **Visual Country Map**: See the region of each country on an interactive map
- **Recent Lookups**: Track your recent searches with local storage
- **Comprehensive Database**: Over 150 country codes with detailed staff type information
- **Beautiful Design**: Modern, responsive design with smooth animations
- **Fun Easter Eggs**: Click the logo 5 times for a surprise!

## How It Works

US diplomatic license plates use a three-letter code system:
- **First two letters**: Country code (intentionally obscure for security)
- **Third letter**: Staff type (D=Diplomat, C=Consular, S=Staff, A=Admin, M=Mission)
- **Numbers**: Vehicle sequence number

Example: `AF-D-1234` = Japan, Diplomat

## Files

- `index.html` - Main application structure
- `style.css` - Modern, animated styling
- `app.js` - Application logic and interactivity
- `diplomatic-data.json` - Comprehensive database of country codes

## Usage

Simply open `index.html` in a web browser. No build process or server required!

## Data Source

Country codes are based on publicly available US Department of State Office of Foreign Missions information.
