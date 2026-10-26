/* Generated; runs before React and before first paint. */
(function(){
var root=document.documentElement,theme='system',language='fr',choice={version:1,light:'signature',dark:'signature'},backgrounds={"signature":{"light":"#e8dfd0","dark":"#19151b"},"porcelaine":{"light":"#e9eeeb","dark":"#161b19"},"eucalyptus":{"light":"#e8dfd0","dark":"#17221e"},"sauge":{"light":"#e3e8dc","dark":"#111614"},"ocean":{"light":"#e1e9ef","dark":"#182b3a"},"glacier":{"light":"#e4eaf0","dark":"#11151b"},"foret":{"light":"#e2e9df","dark":"#132b25"},"bordeaux":{"light":"#efdfdf","dark":"#2b1420"},"corail":{"light":"#f0dfd3","dark":"#251a17"},"abricot":{"light":"#f1d8c1","dark":"#221c18"},"soleil":{"light":"#eae4cf","dark":"#102a30"},"violet":{"light":"#eae0ef","dark":"#21182c"},"noir":{"light":"#eeeeee","dark":"#000000"}};
try{var p=JSON.parse(localStorage.getItem('a-l-est-preferences-v1')||'null');if(p){if(p.theme==='light'||p.theme==='dark')theme=p.theme;if(['fr','en','zh-CN','es'].includes(p.language))language=p.language;}}catch(e){}
try{var c=JSON.parse(localStorage.getItem("detours-palettes-v1")||'null');if(c&&c.version===1){['light','dark'].forEach(function(k){if(typeof c[k]==='string'&&Object.prototype.hasOwnProperty.call(backgrounds,c[k]))choice[k]=c[k];});}}catch(e){}
var resolved=theme==='system'?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):theme;
root.dataset.theme=resolved;root.dataset.palette=choice[resolved];root.lang=language;root.style.colorScheme=resolved;
var meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.setAttribute('content',backgrounds[choice[resolved]][resolved]);
})();
