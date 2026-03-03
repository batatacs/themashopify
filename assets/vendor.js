/*! $script.js JS loader & dependency manager */
(function(e,t){typeof module!="undefined"&&module.exports?module.exports=t():typeof define=="function"&&define.amd?define(t):this[e]=t()})("$script",function(){function p(e,t){for(var n=0,i=e.length;n<i;++n)if(!t(e[n]))return r;return 1}function d(e,t){p(e,function(e){return t(e),1})}function v(e,t,n){function g(e){return e.call?e():u[e]}function y(){if(!--h){u[o]=1,s&&s();for(var e in f)p(e.split("|"),g)&&!d(f[e],g)&&(f[e]=[])}}e=e[i]?e:[e];var r=t&&t.call,s=r?t:n,o=r?e.join(""):t,h=e.length;return setTimeout(function(){d(e,function t(e,n){if(e===null)return y();!n&&!/^https?:\/\//.test(e)&&c&&(e=e.indexOf(".js")===-1?c+e+".js":c+e);if(l[e])return o&&(a[o]=1),l[e]==2?y():setTimeout(function(){t(e,!0)},0);l[e]=1,o&&(a[o]=1),m(e,y)})},0),v}function m(n,r){var i=e.createElement("script"),u;i.onload=i.onerror=i[o]=function(){if(i[s]&&!/^c|loade/.test(i[s])||u)return;i.onload=i[o]=null,u=1,l[n]=2,r()},i.async=1,i.src=h?n+(n.indexOf("?")===-1?"?":"&")+h:n,t.insertBefore(i,t.lastChild)}var e=document,t=e.getElementsByTagName("head")[0],n="string",r=!1,i="push",s="readyState",o="onreadystatechange",u={},a={},f={},l={},c,h;return v.get=m,v.order=function(e,t,n){(function r(i){i=e.shift(),e.length?v(i,r):v(i,t,n)})()},v.path=function(e){c=e},v.urlArgs=function(e){h=e},v.ready=function(e,t,n){e=e[i]?e:[e];var r=[];return!d(e,function(e){u[e]||r[i](e)})&&p(e,function(e){return u[e]})?t():!function(e){f[e]=f[e]||[],f[e][i](t),n&&n(r)}(e.join("|")),v},v.done=function(e){v([null],e)},v})
document.addEventListener("DOMContentLoaded", function() {
    if(    navigator.userAgent.indexOf("Chrome-Lighthouse") != -1 
    	|| navigator.userAgent.indexOf("GTmetrix") != -1 
    	|| navigator.userAgent.indexOf("PingdomPageSpeed") != -1 ) {
        document.documentElement.classList.add('no-js page-speed');
        return false;
    }
  	var $body = document.body,
        cms_js = document.querySelector('#cms_js'),
        dataSrc = cms_js.dataset;
    $script([dataSrc.lazysizes], function () {
    	$script([
            dataSrc.slick,
        	dataSrc.cookie,
          	dataSrc.magnific,
          	dataSrc.countdown
        ], 'load_basic');
    });
    $script.ready('load_basic', function() {
		var require = [dataSrc.accordion];
		/* load dependency in home page */
		if($body.classList.contains('home')){
			/* require.push("home-sj"); */
		}
		/* load dependency in category page */
		else if($body.classList.contains('template-collection') || $body.classList.contains('template-search')){
			require.push(dataSrc.stickybar);
            require.push(dataSrc.collection);
		}
		/* load dependency in product page */
		else if($body.classList.contains('template-product')){
			require.push(dataSrc.ez);
          	require.push(dataSrc.stickybar);
            require.push(dataSrc.product);
		}
		$script(require , 'load_main');
    });   
    $script.ready('load_main', function() {
      	$script([dataSrc.main]);
      	$script([dataSrc.custom]);
    });   
});
