# Trackcrastinate

> Track your procrastination with style. Reclaim your time with a sense of humor.

Trackcrastinate is a browser extension and dashboard that helps you become aware of your unproductive browsing habits through elegant data visualization and humorous, Severance-inspired feedback.

## ✨ Features

- **🕒 Time Tracking**: Automatically tracks time spent on distracting websites
- **📊 Elegant Dashboard**: Visualizes your usage data with clean, Severance-inspired design
- **😏 Sarcastic Insights**: Provides humorous "roasts" about your browsing habits
- **📈 Category Analysis**: Breaks down your unproductive time by category
- **⏰ Daily Limits**: Set time limits for unproductive sites
- **🦕 Chrome Dino Game**: Play when you hit your time limits
- **☁️ Cross-device Sync**: Sync your data across devices with Supabase
- **📱 Offline Support**: Works even when you're offline

## 🎨 Design Philosophy

Trackcrastinate features a unique design inspired by the TV show Severance, with:

- **Clean, Corporate Aesthetic**: Minimalist interfaces with precise spacing
- **Lumon-inspired Color Palette**: Teal/green primary colors with strategic accent colors
- **Monospaced Fonts**: For data displays, reminiscent of the terminals in the show
- **Bifurcation Theme**: Split views representing work/personal separation
- **Corporate Speak**: Playful use of corporate language with a twist

## 🏗️ Project Structure

```
/
├── extension/           # Chrome extension code
│   ├── manifest.json    # Extension manifest
│   ├── background.js    # Service worker
│   ├── popup/          # Extension popup UI
│   ├── options/        # Extension settings
│   ├── icons/          # Extension icons
│   ├── dino-game/      # Chrome Dino game for time limits
│   └── activities/     # Productivity break activities
├── dashboard-nextjs/    # Next.js dashboard application
│   ├── src/
│   │   ├── app/        # Next.js app router pages
│   │   ├── components/ # React components
│   │   ├── lib/        # Utilities and integrations
│   │   └── types/      # TypeScript type definitions
│   └── public/         # Static assets
└── shared/             # Shared utilities and types
```

## 🛠️ Technologies Used

- **Extension**: JavaScript, Chrome Extension APIs (Manifest V3)
- **Frontend**: Next.js 14, React, TypeScript, TailwindCSS
- **Backend**: Supabase (PostgreSQL, Auth)
- **Visualization**: Chart.js
- **Typography**: IBM Plex Sans, IBM Plex Mono, Inter

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn
- A Supabase project (for backend functionality)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/mdarud/Trackcrastinate.git
   cd Trackcrastinate
   ```

2. **Install dependencies:**
   ```bash
   # Install extension dependencies
   cd extension
   npm install
   
   # Install dashboard dependencies
   cd ../dashboard-nextjs
   npm install
   ```

3. **Configure Supabase:**
   - Create a Supabase project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key
   - Create a `.env.local` file in the `dashboard-nextjs` directory:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```
   - Run the SQL schema from `supabase-schema.sql` in your Supabase SQL editor

4. **Run the dashboard:**
   ```bash
   cd dashboard-nextjs
   npm run dev
   ```

5. **Load the extension in Chrome:**
   - Open Chrome and navigate to `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `extension` directory

## 📖 Usage

### Extension Setup
1. After installation, click the Trackcrastinate icon in your browser
2. Complete the onboarding flow to set up your tracked sites
3. Configure your time limits and notification preferences
4. Sign in to sync your data across devices

### Dashboard
1. Visit the dashboard to see detailed statistics and visualizations
2. Review your productivity metrics and deviation analysis
3. Enjoy the Severance-inspired "department announcements"
4. Download detailed reports of your browsing habits

### Time Limits
- When you reach your daily limit on unproductive sites, you'll receive notifications
- At 100% of your limit, the Chrome Dino game will appear
- Complete productivity activities to continue browsing

## 🎮 Features in Detail

### Extension Features
- **Smart Tracking**: Automatically detects and categorizes unproductive websites
- **Graduated Warnings**: Receive notifications at 50%, 75%, 90%, and 95% of your limits
- **Productivity Activities**: Mini-games and exercises when you need a break
- **Onboarding Experience**: Guided setup for new users
- **Offline Mode**: Continue tracking even without internet connection

### Dashboard Features
- **Daily Statistics**: Comprehensive view of your daily browsing habits
- **Top Sites Analysis**: See which sites consume most of your time
- **Category Breakdown**: Visual breakdown by content category
- **Wellness Assessment**: Productivity score and focus metrics
- **Roast Generator**: Humorous insights about your browsing patterns
- **Report Generation**: Download detailed HTML reports

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the TV show Severance and its unique aesthetic
- Built with modern web technologies and best practices
- Special thanks to all contributors and testers

## 📞 Support

If you encounter any issues or have questions, please [open an issue](https://github.com/mdarud/Trackcrastinate/issues) on GitHub.

---

*"Please enjoy each moment of productivity tracking as it occurs."* - Management
