const params = new URLSearchParams(location.search);
const url = params.get('url');
console.log(url);

setTimeout(()=>{
    if(url){
        window.location = url;
    }
}, 500);