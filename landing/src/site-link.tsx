import {Link, type LinkProps} from 'react-router-dom';
const systemPaths=['/auth/signup','/auth/login','/hub','/courses'];
export function SiteLink(props:LinkProps){
 const path=typeof props.to==='string'?props.to:'';
 if(systemPaths.some(p=>path===p||path.startsWith(p+'/'))){
  const base=import.meta.env.VITE_HUB_URL?.replace(/\/$/,'');
  const {to:_,...rest}=props;
  return <a {...rest} href={base?`${base}${path}`:'/plp-hub#availability'}/>;
 }
 return <Link {...props}/>;
}
