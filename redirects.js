// Change the filename to redirects.mjs if opting for the file extension method
import fetch from 'node-fetch'

export default async () => {
  const domain = 'https://ecommerce-git-main-ericrishers-projects.vercel.app'
  const internetExplorerRedirect = {
    source: '/:path((?!ie-incompatible.html$).*)',
    has: [
      {
        type: 'header',
        key: 'user-agent',
        value: '(.*Trident.*)',
      },
    ],
    permanent: false,
    destination: '/ie-incompatible.html',
  }

  try {
    const apiUrl = `${domain}/api/redirects?limit=1000&depth=1`
    const redirectsRes = await fetch(apiUrl)
    const redirectsData = await redirectsRes.json()

    if (!redirectsData.docs) {
      throw new Error('API data is not in the expected format.')
    }

    const dynamicRedirects = redirectsData.docs
      .map(doc => {
        const { from, to: { type, url, reference } = {} } = doc
        let source = from.replace(domain, '').split('?')[0].toLowerCase()
        if (source.endsWith('/')) {
          source = source.slice(0, -1)
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
      .filter(Boolean)

    return [internetExplorerRedirect, ...dynamicRedirects]
  } catch (error) {
    console.error(`Error configuring redirects: ${error}`)
    return [internetExplorerRedirect]
  }
}
