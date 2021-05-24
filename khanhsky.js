var fs = global.nodemodule["fs"];
var merge = global.nodemodule["merge-images"];
var path = global.nodemodule["path"];
var { Canvas, Image } = global.nodemodule["canvas"];
var text2png = global.nodemodule["text2png"];
var waiton = global.nodemodule['wait-on']
var time = new Date();

function ensureExists(path, mask) {
    if (typeof mask != "number") {
        mask = 0o777;
    }
    try {
        fs.mkdirSync(path, {
            mode: mask,
            recursive: true
        });
        return undefined;
    } catch (ex) {
        return { err: ex };
    }
}

var rootpath = path.resolve(__dirname, "..", "khanhsky-data");
ensureExists(rootpath);
ensureExists(path.join(rootpath, "temp"));
ensureExists(path.join(rootpath, "images"));
ensureExists(path.join(rootpath, "fonts"))

var nameMapping = {
    "khanhsky": path.join(rootpath, "images", "khanhsky.jpg"),
    "arial": path.join(rootpath, "fonts", "arial.ttf"),
}

for (var n in nameMapping) {
    if (!fs.existsSync(nameMapping[n])) {
        fs.writeFileSync(nameMapping[n], global.fileMap[n]);
    }
}


var khanhsky = async function (type, data) {
    if(!fs.existsSync(path.join(rootpath, 'images', 'khanhsky.jpg'))) {
        var dt = await fetch('https://scontent.xx.fbcdn.net/v/t1.15752-0/p180x540/185862017_1065766717285997_1628029449228701754_n.jpg?_nc_cat=100&ccb=1-3&_nc_sid=aee45a&_nc_ohc=xIIqEISF2egAX86NT3l&_nc_ad=z-m&_nc_cid=0&_nc_ht=scontent.xx&tp=6&oh=e7d78188fc4aab7e6d78c4bb2d6a557e&oe=60D0116B')
        var dtb = await dt.buffer()
        fs.writeFileSync(path.join(rootpath, 'images', 'khanhsky.jpg'), dtb)
    }
    if(!fs.existsSync(path.join(rootpath, 'fonts', 'arial.ttf'))) {
        var ft = await fetch('https://raw.githubusercontent.com/CuSO4-c3c/mark-plugin-for-c3cbot-0.x/main/fonts/arial.ttf')
        var ftb = await ft.buffer()
        fs.writeFileSync(path.join(rootpath, 'fonts', 'arial.ttf'), ftb)
    }
    var args = data.args
    var fontsize = args[1]
    if (!isNaN(fontsize) === true) {
        if(args.length > 2) {
            args.shift()
            args.shift()
        } else if(args.length === 2) {
            var fontsize = '30'
            args.shift()
        } else {
            var fontsize = '30'
            args.shift()
        }
    } else if(!isNaN(fontsize) === false) {
        var fontsize = '30'
        args.shift()
    }
    if (args.length < 1) {
        return {
            handler: 'internal',
            data: 'Vui lòng nhập theo cú pháp: /khanhsky [cỡ chữ](mặc định 30) <tin nhắn> (nếu nhiều dòng thì để mỗi dòng trong \'\')!'
        }
    } else {
        if(args[0][0] === "'") {
            var text = args.join('\n').replace(/'/g, "")
            var y = 610
        } else {
            var text = args.join(' ')
            var y = 710
        }
        console.log(text)
        var tf = fontsize + 'px Arial'
        var fontpath = path.join(rootpath, "fonts", "arial.ttf")
        var temp = "temp_" + Date.now() + ".png";
        var temp1 = "temp1_" + Date.now() + ".png";
        var succ = 'succ_' + Date.now() + '.png'
        var text = decodeURIComponent(text)
        fs.writeFileSync(path.join(rootpath, "temp", temp), text2png(text, {
            color: "#000000",
            font: tf,
            localFontPath: fontpath,
            localFontName: "Arial",
            lineSpacing : 10
        }));
        fs.writeFileSync(path.join(rootpath, "temp", temp1), text2png('- Khánh Sky', {
            color: "#000000",
            font: "20px Arial",
            localFontPath: fontpath,
            localFontName: "Arial"
        }));
        waiton({
            resources: [
                path.join(rootpath, "temp", temp),
                path.join(rootpath, "temp", temp1),
            ],
            timeout: 5000
        }).then(function () {
            merge(
                [
                    {
                        src: path.join(rootpath, "images", "khanhsky.jpg")
                    },
                    {
                        src: path.join(rootpath, "temp", temp),
                        x: 45,
                        y: y
                    },
                    {
                        src: path.join(rootpath, "temp", temp1),
                        x: 260,
                        y: 830
                    }
                ], {
                Canvas: Canvas,
                Image: Image
            }
            ).then(function (res) {

                fs.writeFile(
                    path.join(rootpath, "temp", succ),
                    res.replace(/^data:image\/png;base64,/, ""),
                    "base64",
                    function (err) {

                        if (err) data.log(err);

                        var img = fs.createReadStream(path.join(rootpath, "temp", succ));

                        data.return({
                            handler: "internal-raw",
                            data: {
                                body: "",
                                attachment: ([img])
                            }
                        });
                        img.on("close", () => {
                            try {
                                fs.unlinkSync(path.join(rootpath, "temp", temp));
                                fs.unlinkSync(path.join(rootpath, "temp", temp1));
                            } catch (err) { }
                        })
                    });
            }).catch(err => {
                data.log(err);
            });
        }).catch(err => {
            data.log(err);
        });
    }
}

module.exports = {
    khanhsky: khanhsky