# Lookatmedia AI Assist Widget

Frontend-only chat widget built with vanilla JavaScript and Vite.

## Owner deployment

The client does not need Node.js, npm, this project, or access to the source files. You build and host the widget once, then give the client one script tag.

## 1. Build the widget on your machine or server

Open a terminal in this project folder and install dependencies:

```bash
npm install
```

Create the standalone browser file:

```bash
npm run build:embed
```

This creates:

```text
dist/embed/lam-chat-widget.js
```

That JavaScript file contains the widget code, CSS, and SVG icons. You only need to publish this one file.

## 2. Upload the bundle to your server

Upload this generated file to a public HTTPS location on your server:

```text
dist/embed/lam-chat-widget.js
```

For example, publish it at:

```text
https://widgets.your-domain.com/lam-chat-widget.js
```

Test that URL directly in a browser. It must not return a 404 or access-denied page. Keep the URL stable so clients never need to change their script tag.

## 3. Test it locally

Run the development preview:

```bash
npm run dev
```

Open the local URL shown in the terminal, usually:

```text
http://localhost:5173/
```

The local preview uses the same widget source as the standalone embed.

## 4. Give the client one script tag

Give the website owner this one script tag. They can add it inside the host site's `<head>` or immediately before `</body>`:

```html
<script src="https://widgets.your-domain.com/lam-chat-widget.js"></script>
```

The widget initializes automatically. No additional HTML element, CSS, or JavaScript is required.

It starts closed with the launcher visible. Clicking the launcher opens the chat, and clicking it again or clicking the close icon closes the chat.

## 5. Add it to myriadsolutionz.com on Hostinger WordPress

The client only needs to perform these WordPress steps. They do not run npm, build the project, upload icons, or edit widget source files.

1. Log in to the WordPress administrator dashboard for `myriadsolutionz.com`.
2. Use Hostinger's site-wide scripts feature, or install a trusted header/footer script plugin.
3. Create a site-wide script entry.
4. Paste this script:

```html
<script src="https://widgets.your-domain.com/lam-chat-widget.js"></script>
```

5. Place it in the site header or footer.
6. Save or publish the change.
7. Clear Hostinger, WordPress, and CDN caches if they are enabled.
8. Open `https://myriadsolutionz.com` in a private browser window and check the bottom-right corner.

If WordPress removes a script from a Custom HTML block, use Hostinger's site-wide script area or a header/footer plugin instead.

## 6. Customize the text

Add optional `data-*` attributes to the same script tag:

```html
<script
  src="https://widgets.your-domain.com/lam-chat-widget.js"
  data-title="Lookatmedia™AIAssist"
  data-greeting="How may I help you?"
  data-placeholder="Ask a question..."
  data-client-id="myriadsolutionz"
></script>
```

Available attributes:

| Attribute | Default |
| --- | --- |
| `data-title` | `Lookatmedia™AIAssist` |
| `data-greeting` | `How may I help you?` |
| `data-placeholder` | `Ask a question...` |
| `data-client-id` | `default` |

## Browser-local message history

The widget saves the conversation in the visitor's browser using `localStorage`. It remains available after a page refresh or closing and reopening the browser on the same website and browser profile.

Each client can use a separate storage key:

```html
<script
  src="https://widgets.your-domain.com/lam-chat-widget.js"
  data-client-id="myriadsolutionz"
></script>
```

This is frontend-only storage. Messages are not shared across devices or browsers, and they are removed if the visitor clears site data or uses private browsing. Do not store secrets in the browser.

## 7. React, Vue, or other frontend apps

Add the same script tag to the application's root HTML file:

- React/Vite: `index.html`
- Vue/Vite: `index.html`
- Next.js: use the document head or a Script component
- Plain HTML: `index.html`

Do not import `src/main.js` into the other project. Publish and use the generated `dist/embed/lam-chat-widget.js` file instead.

## 8. Updating the widget

After changing the widget source:

```bash
npm run build:embed
```

Upload the new `dist/embed/lam-chat-widget.js` to the same server URL and refresh the host site. Clients do not need to change their script tag. If the old version remains visible, clear the browser/CDN cache or temporarily use:

```html
<script src="https://widgets.your-domain.com/lam-chat-widget.js?v=2"></script>
```

## Current limitation

The response is currently a delayed local mock response. The widget does not yet connect to an AI API, backend, authentication system, database, or analytics service. A real API can be connected later inside the form submission handler.