// update 2020.8.30
import fs from "fs"
import os from "os"
import { rm, opendir, copyFile as fsCopyFile, cp, stat, readFile as fsReadFile } from 'node:fs/promises';
import path from "path"
import { v4 as uuidv4 } from "uuid"
import { spawn } from "child_process";

const IMG_SUFFIXS = [".jpg", ".jpeg", ".png"];

export function safeAwait(promise) {
    return promise.then(res => [res, null]).catch(error => [null, error])
}

/**
 * 异步返回读取目录
 */
export async function listDirAsync(pathname, options = {
    suffixFilters: [],
    recursive: false
}) {
    // let abosultePath = path.resolve(pathname);
    // return readdir(abosultePath);
    return listDir(pathname, options);
}

export async function listImgInDirAsync(pathname) {
    return listDir(pathname, {
        suffixFilters: IMG_SUFFIXS,
        recursive: false
    })
}


/**
 * 统计文件夹内的图片数量
 * @param {string} pathname 
 */
export async function countImgInDir(pathname) {
    return countFileInDir(pathname, {
        suffixFilters: IMG_SUFFIXS,
        recursive: false
    })
}

/**
 * 统计文件夹内的文件数量
 * @param {string} pathname 路径名
 * @param {object} options 选项
 */
export async function countFileInDir(pathname, options = {
    // 文件后缀
    suffixFilters: [],
    // 递归查找
    recursive: false
}) {
    let count = 0;
    let abosultePath = path.resolve(pathname);
    const dir = await opendir(abosultePath);
    for await (let item of dir) {
        let itemPath = path.resolve(pathname, item.name);
        // 递归遍历目录
        if (item.isDirectory() && recursive) {
            count += (await countFileInDir(itemPath, { suffixFilters: options.suffixFilters, recursive: true }));
            continue;
        }
        if (item.isFile()) {
            let itemSuffix = item.name.substring(item.name.lastIndexOf("."));
            // 如果文件类型不匹配，则过滤此文件
            if (options.suffixFilters.length > 0 && options.suffixFilters.indexOf(itemSuffix) < 0) {
                continue;
            }
            count++;
        }
    }
    return count;
}

/**
 * 递归遍历目录，返回所有文件（不包含目录）
 * @returns object 
 * {fullPath, filename, fullPathWithoutSuffix, suffix}
 */
export async function listDir(pathname, options = {
    suffixFilters: [],
    recursive: false
}) {
    let suffixFilters = options.suffixFilters;
    let recursive = options.recursive;
    let res = []
    // 解析出绝对路径
    // http://nodejs.cn/api/path.html#pathresolvepaths
    let abosultePath = path.resolve(pathname);

    const dir = await opendir(abosultePath);
    for await (let item of dir) {

        let itemPath = path.resolve(pathname, item.name);
        // 递归遍历目录
        if (item.isDirectory() && recursive) {
            res = res.concat((await listDir(itemPath, { suffixFilters: suffixFilters, recursive: true })));
            continue;
        }
        if (item.isFile()) {
            let itemSuffix = item.name.substring(item.name.lastIndexOf("."));
            // 如果文件类型不匹配，则过滤此文件
            if (suffixFilters.length > 0 && suffixFilters.indexOf(itemSuffix) < 0) {
                continue;
            }
            res.push({
                fullPath: itemPath,
                filename: item.name,
                // file name without suffix
                // "test.txt" -> "test"
                filenameWithoutSuffix: item.name.substring(0, item.name.lastIndexOf(".")),
                // 不包含文件后缀的完整路径
                fullPathWithoutSuffix: itemPath.substring(0, itemPath.lastIndexOf(".")),
                // 文件后缀
                suffix: itemSuffix,
                // isDirectory: item.isDirectory(),
                // isFile: item.isFile(),
            });
        }
    }
    return res;
}

/**
 * 打开并读取文件
 * @param {*}} pathname 完整路径
 */
export async function readFile(pathname) {
    let content = await fsReadFile(pathname, {
        encoding: "utf8"
    });
    return content.replaceAll("\r\n", "\n");
}

/**
 * 如果最后一个元素为空，则忽略此元素
 * @param {*} str 
 * @param {*} separator 
 * @returns 
 */
export function split(str, separator = ",") {
    return str.split(separator)
        .filter((item, index, arr) => index != arr.length - 1 || item != '');
}

/**
 * 判断给定目录是否存在
 * @param {*} dirpath 
 * @returns 
 */
export function existDir(dirpath) {
    // 如果不存在，返回false
    if (!fs.existsSync(dirpath)) {
        return false;
    }
    let stat = fs.statSync(dirpath);
    return stat.isDirectory();
}

/**
 * 拷贝一个目录中的所有文件到另一个目录
 * @returns 
 */
export async function copyDir2Dir(sourceDir, targetDir) {
    if (!existDir(sourceDir)) {
        throw new Error(`文件夹${sourceDir}不存在`)
    };
    if (!existDir(targetDir)) {
        throw new Error(`文件夹${targetDir}不存在`)
    };
    // 递归遍历目录内所有文件
    let files = await listDirAsync(sourceDir, { recursive: true });
    // 将目录内所有文件，按原来名字拷贝到targetDir
    for (let file of files) {
        let destPath = path.resolve(targetDir, file.filename);
        fs.copyFileSync(file.fullPath, destPath);
    }
}

export async function copyFile(src, dest) {
    // try safe copy first
    let [res, err] = await safeAwait(fsCopyFile(src, dest));
    // console.log(res, err);
    // 如果nodejs拷贝失败，则尝试使用系统命令进行拷贝
    if (err) {
        let command;
        // windows拷贝命令为copy
        if (os.platform == "win32") {
            command = spawn("copy", [src, dest]);
        } else {
            // linux拷贝命令为cp
            command = spawn("cp", [src, dest]);
        }
        return new Promise((resolve, reject) => {
            // close总在exit后，且io流已关闭
            command.on('close', (code) => {
                resolve(code);
            })
            // exit时，可能有io流未关闭
            command.on("exit", (code) => {
            });
            command.on("error", (error) => {
                reject(error);
            });
        });
    }
    return res;
}

/**
 * 读取json文件并转换为对象
 * @param {*} pathname 
 * @returns 
 */
export function readJsonFileAsObj(pathname) {
    if (!fs.existsSync(pathname)) {
        throw new Error(`文件${pathname}不存在`)
    }
    let content = fs.readFileSync(pathname, {
        encoding: "utf8"
    });
    return JSON.parse(content);
}

export function readJsonFileAsObjAsync(pathname) {
    return new Promise((resolve, reject) => {
        try {
            let obj = readJsonFileAsObj(pathname);
            resolve(obj);
        } catch (e) {
            reject(e);
        }
    })
}

/**
 * 将对象以json形式保存到文件
 * @param {*} obj 
 * @param {*} override 是否覆盖现有文件 
 * @returns 
 */
export function writeObj2File(obj, pathname, override = false) {
    if (!override && fs.existsSync(pathname)) {
        throw new Error(`文件${pathname}已存在`)
    }
    let content = JSON.stringify(obj);
    fs.writeFileSync(pathname, content, {
        encoding: "utf8",
        // 如果不存在则新建
        flag: "w+"
    });
    return pathname;
}

export function isEmptyDir(pathname) {
    if (!fs.existsSync(pathname)) {
        return true;
    }
    let files = fs.readdirSync(pathname);
    return files.length == 0;
}

// force:true，代表忽略文件夹不存在的异常
export async function deleteFile(path, options = {
    force: true
}) {
    if (!path) {
        return;
    }
    return rm(path, options);
}

// 注意参数名不能为path
export function getFileNameWithoutSuffix(pathname) {
    // 获取后缀
    let extname = path.extname(pathname);
    // 获取不带后缀的文件名
    return path.basename(pathname, extname);
}

export function generateId() {
    return uuidv4();
}

// 运行命令
// 默认超时时间：30秒
export async function runCommand(command, args, options = {
    timeout: 30000
}) {
    return new Promise((resolve, reject) => {
        try {
            let runningProcess = spawn(command, args, options);
            runningProcess.stdout.on("data", (data) => { });
            runningProcess.stderr.on("data", (data) => { });
            // close代表进程退出，且输入输出流已关闭，close总在exit之后
            runningProcess.on("close", (code) => {
                // console.log('close', code);
            });
            // exit代表进程退出，但输入输出流可能仍未关闭（多个进程共享输出流）
            runningProcess.on("exit", (code) => {
                if (code == null || code == 0) {
                    resolve(code);
                } else {
                    console.error('exit code', code, command, args);
                    reject(code);
                }
            });
            runningProcess.on("error", (error) => {
                console.error("run command error", error, command, args);
                reject(error);
            });
            runningProcess.on("message", (message) => {
                console.log("command message", message, command, args)
            });
            runningProcess.stdout.on("data", (data) => {
                console.log(`stdout: ${data}`, command, args)
            });
            runningProcess.stderr.on("data", (data) => {
                console.error(`stderr: ${data}`, command, args)
            });
        } catch (e) {
            reject(e);
        }
    });
};

// 运行一个不会停止的命令，比如启动某项服务
// port代表进程运行在哪个端口上
// waitTime代表等待多长时间后返回成功
export async function runCommandForever({ command, args, options, port, waitTime, ignoreTerminalOutput = true }) {
    return new Promise((resolve, reject) => {
        try {
            let runningProcess = spawn(command, args, options);
            runningProcess.on("error", (error) => {
                console.error("run command error", error, command, args);
                reject(error);
            });
            if (!ignoreTerminalOutput) {
                runningProcess.on("message", (message) => {
                    console.log("command message", message, command, args)
                });
                runningProcess.stdout.on("data", (data) => {
                    console.log(`stdout: ${data}`, command, args)
                });
                runningProcess.stderr.on("data", (data) => {
                    console.error(`stderr: ${data}`, command, args)
                });
            }
            runningProcess.on("close", (code) => {
                console.error("command close", code);
            });
            // exit代表进程退出，但输入输出流可能仍未关闭（多个进程共享输出流）
            runningProcess.on("exit", (code) => {
                console.error("command exit", code);
                reject();
            });
            setTimeout(async () => {
                // 如果指定了端口，判断端口是否存活
                if (port) {
                    if (await checkPortAlive(port)) {
                        resolve();
                    } else {
                        reject();
                    }
                }
                // 未指定端口，直接返回
                resolve();
            }, waitTime);
        } catch (e) {
            reject(e);
        }
    });
};

export async function existFile(path) {
    if (!path) {
        return false;
    }
    try {
        let res = await stat(path);
        return res.isFile();
    } catch (e) {
        // console.error('exist error', e);
        return false;
    }
}

export function getPortFromUrl(url) {
    if (!url) {
        return null;
    }
    let index = url.lastIndexOf(':')
    if (index < 0)
        return null;
    return url.substring(index + 1);
}

export async function checkPortAlive(port, method = 'tcp') {
    // windows
    if (process.platform == 'win32') {
        let [res, err] = await safeAwait(sh('netstat -nao'));
        if (err) {
            return false;
        }
        const { stdout } = res
        if (!stdout) return false;

        const lines = stdout.split('\n')
        const lineWithLocalPortRegEx = new RegExp(`^ *${method.toUpperCase()} *[^ ]*:${port}`, 'gm')
        const linesWithLocalPort = lines.filter(line => line.match(lineWithLocalPortRegEx))

        const pids = linesWithLocalPort.reduce((acc, line) => {
            const match = line.match(/(\d*)\w*(\n|$)/gm)
            return match && match[0] && !acc.includes(match[0]) ? acc.concat(match[0]) : acc
        }, [])

        return pids.length > 0;
    }
    // linux
    let [res, err] = await safeAwait(sh('lsof -i -P'));
    if (err) {
        return false;
    }
    const { stdout } = res
    if (!stdout) return false;
    const lines = stdout.split('\n')
    const existProccess = lines.filter((line) => line.match(new RegExp(`:*${port}`))).length > 0
    return existProccess;
}

/**
 * 返回紧凑型日期格式: 20221201
 */
export function getCompactToday() {
    return customFormatTime(new Date(), "yyyyMMdd");
}

/**
 * 将紧凑型日期转化为时间
 * month 表示月份的整数值，从 0（1 月）到 11（12 月）。
 * 20221101
 * @param {*} dateStr 
 */
export function parseCompactDate(dateStr) {
    if (dateStr.length != 8 || isNaN(Number(dateStr))) {
        return null;
    }
    let year = parseInt(dateStr.substring(0, 4));
    let month = parseInt(dateStr.substring(4, 6));
    let day = parseInt(dateStr.substring(6, 8));
    return new Date(year, month - 1, day);
}

// 返回当前时间的标准化格式
export function formatNow() {
    return formatTime(new Date());
}

/**
 * 格式化为标准时间字符串
 * @param {*} date 
 * @returns 
 */
export function formatTime(date) {
    return customFormatTime(date, "yyyy-MM-dd hh:mm:ss");
}

/**
 * 根据自定义模板，格式化字符串
 * @param {*} date 
 * @param {*} fmt 
 * @returns 
 */
export function customFormatTime(date, fmt) {
    let ret;
    const opt = {
        "y+": date.getFullYear().toString(),        // 年
        "M+": (date.getMonth() + 1).toString(),     // 月
        "d+": date.getDate().toString(),            // 日
        "h+": date.getHours().toString(),           // 时
        "m+": date.getMinutes().toString(),         // 分
        "s+": date.getSeconds().toString()          // 秒
        // 有其他格式化字符需求可以继续添加，必须转化成字符串
    };
    for (let k in opt) {
        ret = new RegExp("(" + k + ")").exec(fmt);
        if (ret) {
            fmt = fmt.replace(ret[1], (ret[1].length == 1) ? (opt[k]) : (opt[k].padStart(ret[1].length, "0")))
        };
    };
    return fmt;
}

/**
 * 获取所有本机IP
 */
export function listAllLocalIp() {
    const ifaces = os.networkInterfaces();
    let ips = [];
    for (let i in ifaces) {
        let dev = ifaces[i];
        for (let ip of dev) {
            if (ip.family == 'IPv4') {
                ips.push(ip.address);
            }
        }
    }
    return ips;
}