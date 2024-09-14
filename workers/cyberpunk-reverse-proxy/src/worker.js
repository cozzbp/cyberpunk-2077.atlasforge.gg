addEventListener('fetch', event => {
  // Skip redirects for WordPress preview posts
  if (event.request.url.includes('&preview=true')) { return; }

  event.respondWith(handleRequest(event.request))
})

class AttributeRewriter {
  constructor(rewriteParams) {
    this.attributeName = rewriteParams.attributeName
    this.old_url = rewriteParams.old_url
    this.new_url = rewriteParams.new_url
  }

  element(element) {
    const attribute = element.getAttribute(this.attributeName)
    if (attribute && attribute.startsWith(this.old_url)) {
      element.setAttribute(
        this.attributeName,
        attribute.replace(this.old_url, this.new_url),
      )
    }
  }
}

const rules = [
  {
    from: 'atlasforge.gg/cyberpunk',
    to: 'cyberpunk.atlasforge.gg'
  },
  // more rules here
]

const handleRequest = async req => {
  // Redirect WordPress login to the subdomain
  let baseUrl = req.url;
  if (baseUrl.includes('atlasforge.gg/cyberpunk/wp-login.php')) {
    return new Response('', { status: 302, headers: { 'Location': baseUrl.replace('atlasforge.gg/cyberpunk', 'cyberpunk.atlasforge.gg') } });
  }

  const url = new URL(req.url);

  let fullurl = url.host + url.pathname;
  var newurl = req.url;
  var active_rule = { from: '', to: '' }
  rules.map(rule => {
    if (fullurl.startsWith(rule.from)) {
      let url = req.url;
      newurl = url.replace(rule.from, rule.to);
      active_rule = rule;
      console.log(rule);
    }
  })

  const newRequest = new Request(newurl, new Request(req));
  const res = await fetch(newRequest);

  const rewriter = new HTMLRewriter()
    .on('a', new AttributeRewriter({ attributeName: 'href', old_url: active_rule.from, new_url: active_rule.to }))
    .on('img', new AttributeRewriter({ attributeName: 'src', old_url: active_rule.from, new_url: active_rule.to }))
    .on('link', new AttributeRewriter({ attributeName: 'href', old_url: active_rule.from, new_url: active_rule.to }))
    .on('script', new AttributeRewriter({ attributeName: 'src', old_url: active_rule.from, new_url: active_rule.to }))
  // .on('*', new AttributeRewriter({ attributeName: 'anytext', old_url: active_rule.from, new_url: active_rule.to }))

  if (newurl.indexOf('.js') !== -1 || newurl.indexOf('.xml') !== -1) {
    return res;
  } else {
    return rewriter.transform(res);
  }
}