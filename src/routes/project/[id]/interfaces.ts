export interface IObjectKeys {
    [key: string]: string | number
}

export interface Project extends IObjectKeys {
    id: string
    domain: string
    name: string
    owner: string
    ownertype: string
}
export interface ProjectInstance extends IObjectKeys {
    code: string
    domain: string
    id: string
    port: number
    site_domain: string
    site_name: string
    site_id: string
    type: string
}
export interface Site {
    id: string
    name: string
    code: string
    domain: string
}

export interface Key {
    id: string
    title: string
    sort_key: number
}
export interface ProjectInstanceKey {
    id: string
    project_instance_id: string
    user_keys_id: string
    project_id: string
}
