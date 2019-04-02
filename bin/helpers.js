
const showjson = (res, value)=>{

    res.writeHead(200, {'Content-Type': 'application/json'});

    res.end(JSON.stringify(value));


};

const showtext = (res, value)=>{

    res.writeHead(200, {'Content-Type': 'text/plain'});

    res.end(value);

};

const showerror = (res, value)=>{

    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end(value);
}

module.exports.showjson = showjson;
module.exports.showtext = showtext;
module.exports.showerror = showerror;