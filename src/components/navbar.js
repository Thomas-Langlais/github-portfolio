import React from 'react'
import ReactDOM from 'react-dom'
import '../css/navbar.css'

class NavbarItem extends React.Component {

    static defaultProps = {
        selected: false
    };

    constructor(props) {
        super(props);

        this.goToLocation = this.goToLocation.bind(this);
    }

    render() {
        const selected = this.props.selected;
        
        return (
            <div onClick={this.goToLocation} className={"nav-item" + (selected ? ' selected' : '')}>
                {this.props.title}
            </div>
        )
    }

    goToLocation(e) {
        // document.body.animate({
        //     scrollTop: this.props.location(this.props.locRef, this.props.index)
        // }, 300);
        var location = this.props.location(this.props.locRef, this.props.index);
        window.scroll({
            top: location,
            behavior: 'smooth'
        });
        console.log(location !== window.pageYOffset);
        console.log('done?');
    }
}

class Navbar extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            locationIndex: -1,
            goingToLink: false,
            loading: true
        };

        this.findOffsetLocation = this.findOffsetLocation.bind(this);
        this.calculateLocations = this.calculateLocations.bind(this);
        this.checkForNavItems = this.checkForNavItems.bind(this);
        this.checkForItemEvent = this.checkForItemEvent.bind(this);
        this.getLocation = this.getLocation.bind(this);
        this.transitionFinished = this.transitionFinished.bind(this);
    }

    componentDidMount() {
        var index;
        
        //we need to recalculate
        this.calculateLocations();
        index = this.checkForNavItems(window.pageYOffset);

        
        if (this.state.loading) {
            this.setState(state => {
                return Object.assign(state, {locationIndex: index, loading: false})
            });
        }

        this.navbarLine = document.getElementById('navbar-line');

        //add the handlers
        window.addEventListener('resize', this.calculateLocations);
        window.addEventListener('scroll', this.checkForItemEvent);

        console.log(this);
        window.navbar = this;
    }

    componentWillUnmount() {
        delete this.navbarLine;

        //remove the handlers
        window.removeEventListener('resize', this.calculateLocations);
        window.removeEventListener('scroll', this.checkForItemEvent);
    }
    
    render() {
        
        const { navigatableChildren, navData } = this.renderForChanges(this.props.children);
        this.navData = navData;

        const navLineStyles = this.navLineStyles || (this.navLineStyles = navData.map((item,i,arr) => {
            var per = ((i / (arr.length)) * 100) + '%';
            return {
                left: 'calc(.2em + ' + per + ')'
            }
        }));
        
        return (
            <div>
                <div id="bar">
                    <div id="bar-content">
                        {
                        navData.map((nav,i) => {
                            if (!this.state.loading && i === this.state.locationIndex) {
                                return <NavbarItem selected key={i} index={i} title={nav.title} locRef={nav.ref} 
                                        location={this.getLocation} />;
                            } else {
                                return <NavbarItem key={i} index={i} title={nav.title} locRef={nav.ref} 
                                        location={this.getLocation} />
                            }
                        })
                        }
                        {!this.state.loading &&
                            <div id="navbar-line" onTransitionEnd={this.transitionFinished} style={navLineStyles[this.state.locationIndex]}></div>
                        }
                    </div>
                </div>
                <div ref={Navbar.prototype.NAVBAR} id="nav-content">
                    {navigatableChildren}
                </div>
            </div>
        );
    }

    //util methods
    renderForChanges(children, i = 0) {
        var navData = [];
        var navigatableChildren = React.Children.map(children, (child) => {

            if (!child.props) {
                return child;
            }

            if (child.props.navTitle) {
                let ref = this.NAVBAR_REF + i++;
                navData.push({title: child.props.navTitle, ref: ref});
                return React.cloneElement(child, {ref: ref});
            }

            if (child.props.children) {

                var navChildren = this.renderForChanges(child.props.children, i);
                navData.push(navChildren.navData);
                navData = navData.flat();
                return React.cloneElement(child, {
                    children: navChildren.navigatableChildren
                });
            }
        });

        return {
            navigatableChildren: navigatableChildren,
            navData: navData
        };
    }

    findOffsetLocation(ref) {
        var offsetLocation = 0,
            e = ReactDOM.findDOMNode(this.refs[ref]),
            bound = ReactDOM.findDOMNode(this.refs[Navbar.prototype.NAVBAR]);
        do {
            if (e !== bound && !isNaN(e.offsetTop)) {
                offsetLocation += e.offsetTop;
            }
        } while(e !== bound && (e = e.offsetParent));
        return offsetLocation;
    }

    calculateLocations() {
        this.navData = this.navData.map(navItem => Object.assign(navItem, {location: this.findOffsetLocation(navItem.ref)}));
        this.ranges = this.navData.map((navItem, i, arr) => {
            if (i+1 < arr.length) {
                return {greater: navItem.location, less: arr[i+1].location};
            }
            return {greater: navItem.location};
        })
    }

    checkForNavItems(location) {
        
        var navItemFound = false,
            index = -1;
            
        for (var i = 0; i < this.ranges.length; i++) {
            var range = this.ranges[i];

            if (range.less) {
                navItemFound = (range.greater <= location && location < range.less);
            } else {
                navItemFound = range.greater <= location;
            }
            if (navItemFound) {
                index = i;
                break;
            }
        }
        
        return index;
    }

    getLocation(ref, index) {
        this.setState(state => Object.assign(state, {locationIndex: index, goingToLink: true}));
        return this.findOffsetLocation(ref);
    }

    //events
    checkForItemEvent(e) {
        const index = this.checkForNavItems(e.pageY);

        if (!this.state.goingToLink && this.state.locationIndex !== index) {
            this.setState(state => Object.assign(state, {locationIndex: index}));
        }
    }

    transitionFinished() {
        this.setState(state => Object.assign(state, {goingToLink: false}));
    }
}

Navbar.prototype.NAVBAR_ITEM = 'navbar-item';
Navbar.prototype.NAVBAR_REF = 'navbar-ref';
Navbar.prototype.NAVBAR = 'navbar';

export default Navbar;