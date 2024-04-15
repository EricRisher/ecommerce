const fetch = require('node-fetch') // Make sure to install node-fetch if it isn't already.

module.exports = async () => {
  const domain = 'https://ecommerce-git-main-ericrishers-projects.vercel.app'
  const internetExplorerRedirect = {
    source: '/:path((?!ie-incompatible.html$).*)', // Exclude the IE incompatibility page from this redirect
    has: [
      {
        type: 'header',
        key: 'user-agent',
        value: '(.*Trident.*)', // Targets all IE browsers
      },
    ],
    permanent: false,
    destination: '/ie-incompatible.html',
  }

  try {
    // Ensure the API URL is correct and reachable
    const apiUrl = `${domain}/api/redirects?limit=1000&depth=1`
    const redirectsRes = await fetch(apiUrl)
    const redirectsData = await redirectsRes.json()

    // Check if API call returns the expected data structure
    if (!redirectsData.docs) {
      throw new Error('API data is not in the expected format.')
    }

    const dynamicRedirects = redirectsData.docs
      .map(doc => {
        const { from, to: { type, url, reference } = {} } = doc
        let source = from.replace(domain, '').split('?')[0].toLowerCase()
        if (source.endsWith('/')) {
          source = source.slice(0, -1) // Remove trailing slash to avoid broken redirects
        }

        let destination = '/'
        if (type === 'custom' && url) {
          destination = url.replace(domain, '')
        } else if (type === 'reference' && reference?.value?._status === 'published') {
          destination = `${domain}/${
            reference.relationTo !== 'pages' ? `${reference.relationTo}/` : ''
          }${reference.value.slug}`
        }

        if (source.startsWith('/') && destination && source !== destination) {
          return {
            source,
            destination,
            permanent: true,
          }
        }

        return null
      })
      .filter(Boolean) // Remove any null entries

    return [internetExplorerRedirect, ...dynamicRedirects]
  } catch (error) {
    console.error(`Error configuring redirects: ${error}`) // Always log errors, regardless of environment
    return [internetExplorerRedirect] // Return default redirect if the API call fails
  }
}
