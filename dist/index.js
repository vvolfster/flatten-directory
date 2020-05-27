#! /usr/bin/env node
const path = require("path")
const fs = require("fs-extra")
const lodash = require("lodash")
const packageJson = require("../package.json")

const helpers = {
    filesInDirectory(dir, recursive = true, acc = []) {
        try {
            const files = fs.readdirSync(dir)
            for (const i in files) {
                const name = [dir, files[i]].join(path.sep)
                if (fs.statSync(name).isDirectory()) {
                    if (recursive) {
                        helpers.filesInDirectory(name, recursive, acc)
                    }
                } else {
                    acc.push(name)
                }
            }
            return acc
        } catch (e) {
            return acc
        }
    },
    getEnvVars() {
        const strings = process.argv.slice(2).map((s) => (s.startsWith("--") ? s.slice(2) : s))
        return lodash.reduce(
            strings,
            (acc, v) => {
                if (v.indexOf("=") !== -1) {
                    const [name, value] = v.split("=").map((s) => lodash.trim(s))
                    if (value === "true") {
                        acc[name] = true
                    } else if (value === "false") {
                        acc[name] = false
                    } else {
                        const num = lodash.parseInt(value)
                        acc[name] = lodash.isNaN(num) ? value : num
                    }
                } else {
                    acc[v] = true
                }
                return acc
            },
            {}
        )
    },
    log(...args) {
        const name = `${packageJson.name} (${packageJson.version}) `
        console.log(name, ...args)
    },
    move(oldPath, newPath) {
        try {
            fs.renameSync(oldPath, newPath)
        } catch (e) {
            if (e.code === "EXDEV") {
                fs.copySync(oldPath, newPath, { overwrite: true, dereference: true })
                fs.unlinkSync(oldPath)
            } else {
                throw e
            }
        }
    },
}

const envVars = helpers.getEnvVars()

const rootdir = envVars.rootdir ? path.resolve(process.cwd(), envVars.rootdir) : process.cwd()
const outputdir = path.resolve(process.cwd(), envVars.outputdir || "flatten-directory-output")
const copy = !envVars.cut

const allFiles = helpers.filesInDirectory(rootdir, true)

helpers.log(`Running on dir: ${rootdir}`)
helpers.log(`Processing ${allFiles.length} files...`)
helpers.log(`--------------------------------------`)

allFiles.forEach((orig) => {
    const destFileName = orig.slice(rootdir.length).split(path.sep).filter(Boolean).join("-").split(" ").join("-")
    const dest = path.resolve(outputdir, destFileName)
    helpers.log(`${orig} -> ${dest}`)
    if (copy) {
        fs.copySync(orig, dest, { overwrite: true, dereference: true })
    } else {
        helpers.move(orig, dest)
    }
})

helpers.log(`--------------------------------------`)
helpers.log("done")
