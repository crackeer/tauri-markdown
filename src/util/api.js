import { fetch } from '@tauri-apps/api/http';
import common from './common'
import { Body } from "@tauri-apps/api/http"
const get = async (url, query) => {
    if (query != null) {
        url = url + '?' + common.httpBuildQuery(query)
    }
    try {
        let result = await fetch(url, {
            method: 'GET'
        })
        return result.data    
    } catch(e) {
        console.log(e.message)
        return null
    }
}

const post = async (url, data) => {
    try {
        let result = await fetch(url, {
            method: 'POST',
            body : Body.json(data),
            headers : {
                'Content-Type' : 'application/json'
            }
        })
        return result.data
    } catch(e) {
        console.log(e.message)
        return null
    }
   
}

const getTFState = async () => {
    let result = await get('http://10.11.1.3/__proxy__/calcnode/api_tf_state')
    return result
}

const getTFProjects = async () => {
    let result = await get('http://10.11.1.3/__proxy__/calcnode/api_tf_projects_ls')
    if (result.code != 0) {
        return []
    }
    let list = []
    let pids = result.data.Result
    for (var i in pids) {
        let project = await get('http://10.11.1.3/__proxy__/calcnode/api_tf_projects_cat?project_id=' + pids[i])
        let tmp = {
            project_id: project.data.Result.ProjectID,
            title: project.data.Result.Data.title,
            description: project.data.Result.Data.description,
            db_version: project.data.Result.Data.dbVersion,
            sensor_height: project.data.Result.Data.sensor_height,
            sensor_width: project.data.Result.Data.sensor_width,
            observer_count: project.data.Result.Scans.length,
            create_time: common.convertTs2Time(project.data.Result.Create_At),
        }
        list.push(tmp)
    }
    return list
}

const getTFImportLog = async () => {
    let result = await get('http://10.11.1.3/__proxy__/calcnode/api_tf_autoimport_log_cat')
    if(result.data.Result == undefined || result.data.Result.Importing == undefined) {
        return []
    }
    let list = result.data.Result.Importing
    let retData = []
    for (var i in list) {
        let tmp = {
            uuid: list[i].UUID,
            start_time: common.convertTs2Time(list[i].Started),
            end_time: common.convertTs2Time(list[i].Finished),
            projects : [],
            project_count : 0,
            cost : list[i].Finished - list[i].Started
        }
        if (list[i].Projects != undefined) {
            let projects = list[i].Projects
            let allProject = []
            if (projects.Succeeded != undefined) {
                tmp['project_count'] += list[i].Projects.Succeeded.length
                for (var j in projects.Succeeded) {
                    allProject.push({
                        project_id: projects.Succeeded[j].ID,
                        start_time: common.convertTs2Time(projects.Succeeded[j].Started),
                        end_time: common.convertTs2Time(projects.Succeeded[j].Ended),
                        cost: projects.Succeeded[j].Ended - projects.Succeeded[j].Started,
                        status : 'success'
                    })
                }
            }
            if (projects.Failed != undefined) {
                tmp['project_count'] += list[i].Projects.Failed.length
                for (var k in projects.Failed) {
                    allProject.push({
                        project_id: projects.Failed[k].ID,
                        start_time: common.convertTs2Time(projects.Failed[k].Started),
                        end_time: common.convertTs2Time(projects.Failed[k].Ended),
                        error_code: projects.Failed[k].Error.Code,
                        error_message: projects.Failed[k].Error.String,
                        cost: projects.Failed[k].Ended - projects.Failed[k].Started,
                        status : 'failure'
                    })
                }
            }
            tmp['projects'] = allProject
        }
        retData.push(tmp)
    }
    return retData
}

const getTFVRFileList = async () => {
    let result = await get('http://10.11.1.3/__proxy__/calcnode/api_tf_vrfile_ls')
    if(result == null) {
        return []
    }
    return result.data.Result
}

const queryVrapi = async (query) => {
    let result = await post('http://10.11.1.3/__proxy__/opensvc/util_database_vrapi', query)
    if(result == null) {
        return {
            list : [],
            total_page : 0,
            total : 0,
        }
    }
    return result.data
}

const queryShepherd = async (query) => {
    let result = await post('http://10.11.1.3/__proxy__/shepherd/util_database_shepherd', query)
    if(result == null) {
        return {
            list : [],
            total_page : 0,
            total : 0,
        }
    }
    return result.data
}

const decodeWorkCode = async (query) => {
    let result = await get('http://10.11.1.3/__proxy__/opensvc/util_decode_work_code', query)
    return result.data
}

const getAccessToken = async (query) => {
    let result = await post('http://10.11.1.3/auth/access_token', {
        'app_key' : 'bE0y67lybBZRJr9O',
        'app_secret' : '8R3AGNFE1FGAGCI48BRDWCF5LY95ZC8J'
    })
    return result.data
}


export default {
    getTFState, getTFProjects, getTFImportLog, getTFVRFileList, queryVrapi, queryShepherd, decodeWorkCode, getAccessToken
}

export {
    getTFState, getTFProjects, getTFImportLog, getTFVRFileList, queryVrapi, queryShepherd, decodeWorkCode, getAccessToken
}