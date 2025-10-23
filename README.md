# Diplomatic Plate Decoder

An elegant, premium web application for decoding US diplomatic license plates and discovering their origins with interactive world map visualization.

## Features

- **Single 3-Letter Input**: Simple, intuitive plate code entry (e.g., "DAF" for Japan Diplomat)
- **Interactive World Map**: Real-time country highlighting with svgMap.js library showing actual country outlines
- **Recent Lookups**: Local storage tracking of your 10 most recent searches
- **Comprehensive Database**: 150+ country codes with flags, regions, and detailed staff type information
- **Premium Design**: Enterprise-grade UI with smooth animations, subtle shadows, and professional aesthetics
- **Real-time Validation**: Instant feedback with elegant notifications

## How It Works

US diplomatic license plates use a three-letter code system:
- **1st Letter**: Staff type (D=Diplomat, C=Consular, S=Staff, A=Admin, M=Mission)
- **2nd & 3rd Letters**: Country code (intentionally obscure for security)

### Examples:
- `DAF` = **D**iplomat from Japan (**AF**)
- `DFP` = **D**iplomat from UK (**FP**)
- `CDA` = **C**onsular from Germany (**DA**)
- `SCC` = **S**taff from China (**CC**)

## Files

- `index.html` - Semantic HTML structure with SVG icons
- `style.css` - Premium CSS design with custom properties and animations
- `app.js` - Modern JavaScript with svgMap integration
- `diplomatic-data.json` - Complete database of country and staff codes

## Technology

- **Pure Vanilla JavaScript** - No framework dependencies
- **svgMap.js** - Professional world map library with country highlighting
- **CSS Custom Properties** - Maintainable, theme-ready styling
- **Local Storage API** - Persistent recent lookups

## Usage

Simply open `index.html` in any modern web browser. No build process, server, or dependencies required!

## Data Source

Country codes based on publicly available US Department of State Office of Foreign Missions information.
