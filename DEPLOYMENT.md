# Cricket Auction Pro - Deployment Guide

## 🚀 Quick Deployment Steps

### Option 1: Deploy on Vercel (Recommended - 2 minutes)

1. **Sign up on Vercel**
   - Go to [https://vercel.com](https://vercel.com)
   - Sign up with GitHub (or email)

2. **Connect GitHub Repository**
   - Click "Import Project"
   - Paste your GitHub repository URL
   - Select "Vite" as framework (Vercel will auto-detect)

3. **Add Environment Variables**
   - In Vercel dashboard, go to Settings → Environment Variables
   - Add these variables:
     ```
     VITE_SUPABASE_URL=https://jqsudxfexwxrxfldoqnv.supabase.co
     VITE_SUPABASE_ANON_KEY=sb_publishable_j_Nrgmh166yD2hjI03CzKw_JhRiyApx
     ```

4. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete
   - Your app will have a live URL like: `https://cricauction-pro.vercel.app`

### Option 2: Deploy on Netlify

1. **Sign up on Netlify**
   - Go to [https://netlify.com](https://netlify.com)
   - Connect with GitHub

2. **Create New Site**
   - Click "New site from Git"
   - Select your repository
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Add Environment Variables**
   - Site settings → Build & deploy → Environment
   - Add VITE_ prefixed variables

4. **Deploy**
   - Netlify will automatically deploy on git push

### Option 3: Manual GitHub Pages Deployment

```bash
# Build the project
npm run build

# The dist folder is ready to deploy
```

Then use GitHub Pages or any static hosting.

## 📝 GitHub Repository Setup

### Push to GitHub

```bash
# Create repository on GitHub (https://github.com/new)
# Then run these commands:

git remote add origin https://github.com/YOUR_USERNAME/cricauction-pro.git
git branch -M main
git push -u origin main
```

### Repository Settings

1. Go to repository → Settings
2. Enable GitHub Pages (optional)
3. Add repository description: "Cricket Auction Management System"
4. Add topics: `cricket`, `auction`, `react`, `vite`

## 🔐 Secure Your Credentials

- **Never commit .env.local to GitHub** (already in .gitignore)
- Add environment variables only in your deployment platform
- Rotate API keys regularly

## 🔄 Auto-Deployment

Both Vercel and Netlify support:
- **Automatic deploys on git push** to main branch
- **Preview URLs** for pull requests
- **Production & preview environments**

## 📊 Production Checklist

- [ ] Supabase database configured and tested
- [ ] Environment variables set in deployment platform
- [ ] CORS configured in Supabase
- [ ] SSL certificate enabled
- [ ] Custom domain added (optional)
- [ ] Analytics/monitoring set up
- [ ] Error handling verified

## 🌐 Access Your App

After deployment:
- Vercel URL: `https://cricauction-pro.vercel.app`
- Netlify URL: `https://cricauction-pro.netlify.app`
- Custom domain: `https://yourdomain.com`

Anyone can access without localhost! 🎉

## 🆘 Troubleshooting

**Build fails:**
- Check Node version (must be 16+)
- Verify all env vars are set
- Run `npm install` locally to test

**App doesn't load:**
- Check browser console for errors
- Verify Supabase credentials
- Check CORS settings in Supabase

**Slow performance:**
- Enable caching headers
- Optimize images
- Check Supabase query performance

## 📞 Support

- Vercel Docs: [https://vercel.com/docs](https://vercel.com/docs)
- Netlify Docs: [https://docs.netlify.com](https://docs.netlify.com)
- Supabase Docs: [https://supabase.com/docs](https://supabase.com/docs)
