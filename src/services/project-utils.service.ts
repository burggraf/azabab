import type { Project } from '$models/interfaces';
import { pb } from '$services/backend.service';
export const checkDomainAvailability = async (project: Project) => {
    const domain = project.domain
    let retval = false
    if (!domain) {
        return retval;
    }
    try {
        const { data, error } = await pb.send(`/check-domain/${domain}`, {
			method: 'GET',
		})
        console.log('check-domain data, error', data, error)
        if (error) {
            console.log('ERROR checking domain ' + domain, error)
            return false;
        } else {
            if (data === 0)
                retval = true;
            else
                retval = false;
        }
    } catch (error: any) {
        console.log('ERROR checking domain ' + domain, error)
        return false;
    }
    return retval;
}
