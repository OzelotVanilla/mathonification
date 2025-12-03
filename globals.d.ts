// Solve the cannot import error of CSS file.
declare module "*.css";
declare module "*.scss";
declare module "*.module.css"; // For CSS Modules
declare module "*.txt" // To load txt statically
{
    const content: string
    export default content
}