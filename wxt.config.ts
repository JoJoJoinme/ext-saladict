import { defineConfig } from 'wxt'
import fs from 'node:fs/promises'
import path from 'path'

function copyLegacyStaticAssets() {
  const assetRoot = path.resolve(__dirname, 'assets')
  const outputRoot = path.resolve(__dirname, 'dist/chrome-mv3/assets')

  return {
    name: 'saladict-copy-legacy-static-assets',
    apply: 'build',
    async closeBundle() {
      await fs.mkdir(outputRoot, { recursive: true })

      for (const entry of await fs.readdir(assetRoot)) {
        await fs.cp(path.join(assetRoot, entry), path.join(outputRoot, entry), {
          recursive: true
        })
      }

      await fs.copyFile(
        path.resolve(
          __dirname,
          'node_modules/webextension-polyfill/dist/browser-polyfill.min.js'
        ),
        path.join(outputRoot, 'browser-polyfill.min.js')
      )
      await fs.copyFile(
        path.resolve(__dirname, 'node_modules/trsjs/build/sala/trs.js'),
        path.join(outputRoot, 'trs.js')
      )
    }
  }
}

export default defineConfig({
  srcDir: 'src',
  outDir: 'dist',
  manifest: {
    name: '__MSG_extension_name__',
    short_name: '__MSG_extension_short_name__',
    description: '__MSG_extension_description__',
    default_locale: 'zh_CN',
    homepage_url: 'https://saladict.crimx.com/',
    minimum_chrome_version: '116',
    icons: {
      '16': 'assets/icon-16.png',
      '48': 'assets/icon-48.png',
      '128': 'assets/icon-128.png'
    },
    permissions: [
      'alarms',
      'contextMenus',
      'cookies',
      'declarativeNetRequestWithHostAccess',
      'notifications',
      'storage',
      'tabs',
      'unlimitedStorage',
      'scripting',
      'webRequest',
      'offscreen',
      'system.display'
    ],
    host_permissions: ['<all_urls>'],
    optional_permissions: ['clipboardRead', 'clipboardWrite'],
    commands: {
      'toggle-active': {
        description: '__MSG_command_toggle_active__'
      },
      'toggle-instant': {
        description: '__MSG_command_toggle_instant__'
      },
      'search-clipboard': {
        description: '__MSG_command_search_clipboard__'
      },
      'open-pdf': {
        description: '__MSG_command_open_pdf__'
      },
      'open-quick-search': {
        description: '__MSG_command_open_quick_search__'
      },
      'open-youdao': {
        description: '__MSG_command_open_youdao__'
      },
      'open-google': {
        description: '__MSG_command_open_google__'
      },
      'open-caiyun': {
        description: '__MSG_command_open_caiyun__'
      },
      'next-history': {
        description: '__MSG_command_next_history__'
      },
      'prev-history': {
        description: '__MSG_command_prev_history__'
      },
      'next-profile': {
        description: '__MSG_command_next_profile__'
      },
      'prev-profile': {
        description: '__MSG_command_prev_profile__'
      },
      'profile-1': {
        description: '__MSG_command_profile_1__'
      },
      'profile-2': {
        description: '__MSG_command_profile_2__'
      },
      'profile-3': {
        description: '__MSG_command_profile_3__'
      },
      'profile-4': {
        description: '__MSG_command_profile_4__'
      },
      'profile-5': {
        description: '__MSG_command_profile_5__'
      },
      'add-notebook': {
        description: '__MSG_command_add_notebook__'
      }
    },
    web_accessible_resources: [
      {
        resources: ['assets/*', 'audio-control.html', 'quick-search.html'],
        matches: ['<all_urls>']
      }
    ],
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self'"
    },
    incognito: 'split' as any,
  },
  runner: {
    binaries: {
      chrome: '/usr/bin/google-chrome'
    }
  },
  vite: () => ({
    define: {
      'process.env.DEBUG': 'false',
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.env.SDAPP_VETTED': 'false',
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    plugins: [copyLegacyStaticAssets()],
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
            @import "@/_sass_shared/_namespace.scss";
            @import "@/_sass_shared/_global/_interfaces.scss";
            @import "@/_sass_shared/_global/_mixins.scss";
            @import "@/_sass_shared/_global/_variables.scss";
            @import "@/_sass_shared/_global/_z-indices.scss";
          `
        }
      }
    }
  })
})
