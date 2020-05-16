const path = require("path")
const scripts = require("@20i/scripts")
const packageJson = require("../package.json")

const file = scripts.helpers.file
const envVars = scripts.helpers.env.getEnvVars()

const rootdir = envVars.rootfolder ? path.resolve(process.cwd(), envVars.rootdir) : process.cwd()
const outputdir = path.resolve(process.cwd(), envVars.outputdir || "flatten-dir-output")

const allFiles = file.filesInDirectory(rootdir, true)

const projectedOutput = allFiles.map(fileName => {
    const dest = fileName.slice(rootdir.length).split(path.sep).filter(Boolean).join("-")
    return {
        orig: fileName,
        dest: path.resolve(outputdir, dest)
    }
})

console.log(`Running folder-flattener ${packageJson.version} on folder: ${rootdir}. Processing: ${projectedOutput.length} files`)
projectedOutput.forEach((o) => {
    console.log(`${o.orig} -> ${o.dest}`)
    file.copyFile(o.orig, o.dest)
})


