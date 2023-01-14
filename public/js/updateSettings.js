import axios from "axios";
import { showAlert } from "./alerts";

export const updateAccountSettings = async (data, type) => {
    try {
        const res = await axios({
            method: 'PATCH',
            url: type === "password" ? '/api/v1/users/updateMyPassword' : '/api/v1/users/updateMe',
            data: data
        });
        if (res.data.status === 'success') {
            showAlert('success', `${type === "password" ? "Password" : "Data"} saved successfully!`);
        }
        console.log('settings submit');
    } catch (err) {
        showAlert('error', err.response.data.message);
    }
}