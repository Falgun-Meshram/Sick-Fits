import React from 'react';
import Downshift from 'downshift';
import Router from 'next/router';
import { ApolloConsumer } from 'react-apollo';
import gql from 'graphql-tag';
import debounce from 'lodash.debounce';
import { DropDown, DropDownItem, SearchStyles } from './styles/DropDown';

const SEARCH_ITEMS_QUERRY = gql`
    query SEARCH_ITEMS_QUERRY($searchTerm: String!){
        items(
            where:{
                OR: [
                {title_contains: $searchTerm,}
                {description_contains: $searchTerm,}
                ]
            }
        ){
            id
            image
            title
        }
    }
`;

function routeToItem(item) {
  //   console.log(item.id);

  Router.push({
    pathname: '/item',
    query: {
      id: item.id,
    },
  });
}

class AutoComplete extends React.Component {
  state = {
    items: [],
    loading: false,
  };

  onChange = debounce(async (e, client) => {
    // turn loadin on
    this.setState({
      loading: true,
    });
    // Manually querry the db
    const res = await client.query({
      query: SEARCH_ITEMS_QUERRY,
      variables: { searchTerm: e.target.value },
    });

    this.setState({
      items: res.data.items,
      loading: false,
    });
  }, 350);

  render() {
    return (
      <SearchStyles>
        <Downshift
          onChange={routeToItem}
          itemToString={item => (item === null ? '' : item.title)}
        >
          {({
            getInputProps,
            getItemProps,
            isOpen,
            inputValue,
            highlightedIndex,
          }) => (
            <div className="">
              <ApolloConsumer>
                {client => (
                  <input
                    {...getInputProps({
                      type: 'search',
                      placeholder: 'Search for an item',
                      id: 'search',
                      className: this.state.loading ? 'loading' : '',
                      onChange: e => {
                        e.persist();
                        this.onChange(e, client);
                      },
                    })}
                  />
                )}
              </ApolloConsumer>
              {isOpen &&
                <DropDown>
                  {this.state.items.map((item, index) => (
                    <DropDownItem
                      {...getItemProps({ item })}
                      key={item.id}
                      highlighted={index === highlightedIndex}
                    >
                      <img src={item.image} alt={item.title} width="50" />
                      {item.title}

                    </DropDownItem>
                  ))}
                  {!this.state.items.length &&
                    !this.state.loading &&
                    <DropDownItem>
                      {' '}No Items Found for {inputValue}{' '}
                    </DropDownItem>}
                </DropDown>}
            </div>
          )}
        </Downshift>
      </SearchStyles>
    );
  }
}

export default AutoComplete;
