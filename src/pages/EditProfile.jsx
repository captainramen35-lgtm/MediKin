import CreateProfile from "./CreateProfile";

// EditProfile just re-uses CreateProfile with isEdit=true
const EditProfile = () => <CreateProfile isEdit={true} />;

export default EditProfile;
