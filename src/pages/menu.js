let allMenus = [
    {
        key: "/",
        title: "主页",
        href: "/"
    },
    {
        "key" : "sub1",
        "title" : "工具箱",
        "submenu" :[
            {
                key: "/tool/convert",
                title: "转换",
                href: "/tool/convert"
            },
            {
                key: "/tool/json",
                title: "JSON编辑",
                href: "/tool/json"
            }
        ]
    },
    {
        "key" : "sub2",
        "title" : "Sample",
        "submenu" :[
            {
                key: "/sample/markdown",
                title: "Markdown编辑",
                href: "/sample/markdown"
            }
        ]
    }
]

function getRealPath(path) {
    return path + ".html";
}


 const getMenu =  (currentEnv) => {
    let raws = JSON.stringify(allMenus)
    let menuCopy = JSON.parse(JSON.stringify(allMenus))

    for (var i in menuCopy) {
        if (menuCopy[i].href != undefined && menuCopy[i].key != undefined) {
            menuCopy[i].href = getRealPath(menuCopy[i].href)
            menuCopy[i].key = getRealPath(menuCopy[i].key)

        }
        if (menuCopy[i].submenu != undefined) {
            for (var j in menuCopy[i].submenu) {
                if (menuCopy[i].submenu[j].href != undefined && menuCopy[i].submenu[j].key != undefined) {
                    menuCopy[i].submenu[j].href = getRealPath(menuCopy[i].submenu[j].href)
                    menuCopy[i].submenu[j].key = getRealPath(menuCopy[i].submenu[j].key)
                }
            }
        }
    }
    return menuCopy
}

export default getMenu