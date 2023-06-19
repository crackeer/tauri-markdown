import { fetch } from '@tauri-apps/api/http';
import common from './common'
import dayjs from 'dayjs'
const get = async(url, query) => {
    if(query != null) {
        url = url + '?' + common.httpBuildQuery(query)
    }
    let result = await fetch(url, {
        method : 'GET'
    })
    return result.data
}

const getTFState = async () => {
    let result = await get('http://10.11.1.3/__proxy__/calcnode/api_tf_state')
    return result
}

const getTFProjects = async () => {
    let result = await get('http://10.11.1.3/__proxy__/calcnode/api_tf_projects_ls')
    if(result.code != 0) {
        return []
    }
    let list = []
    let pids = result.data.Result
    for(var i in pids) {
        let project = await get('http://10.11.1.3/__proxy__/calcnode/api_tf_projects_cat?project_id=' + pids[i])  
        console.log(project.data.Result)
        let tmp = {
            project_id : project.data.Result.ProjectID,
            title : project.data.Result.Data.title,
            description : project.data.Result.Data.description,
            db_version :project.data.Result.Data.dbVersion,
            sensor_height : project.data.Result.Data.sensor_height,
            sensor_width : project.data.Result.Data.sensor_width,
            observer_count : project.data.Result.Scans.length,
            create_time : dayjs.unix(project.data.Result.Create_At).format('YYYY-MM-DD HH:mm:ss')
        }
        list.push(tmp)
    }
    console.log(list)
    return list
}


export default {
    getTFState, getTFProjects
}

export {
    getTFState, getTFProjects
}